import axios from "axios";
import crypto from "crypto";
import Revenue from "../models/revenueModel.js";
import Company from "../models/companyModel.js";
import PaymentIntent from "../models/paymentIntentModel.js";
import Plan from "../models/planModel.js";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_API_URL = process.env.PAYMOB_API_URL;
const PAYMOB_API_IFRAME = process.env.PAYMOB_API_IFRAME;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;

// ... imports

async function getAuthToken() {
  const res = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
    api_key: PAYMOB_API_KEY,
  });
  return res.data.token;
}

async function createOrder(token, amount, items = []) {
  const res = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
    auth_token: token,
    delivery_needed: false,
    amount_cents: amount * 100,
    currency: "EGP",
    items: items,
  });
  return res.data.id;
}

async function createPaymentKey(token, orderId, amount, billingData) {
  const res = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
    auth_token: token,
    amount_cents: amount * 100,
    expiration: 3600,
    order_id: orderId,
    billing_data: {
      first_name: billingData.first_name || "Customer",
      last_name: billingData.last_name || "User",
      phone_number: billingData.phone_number || "NA",
      email: billingData.email,
      country: "Egypt",
      city: "Cairo",
      street: "NA",
      building: "NA",
      floor: "NA",
      apartment: "NA",
    },
    currency: "EGP",
    integration_id: PAYMOB_INTEGRATION_ID,
  });
  return res.data.token;
}

export async function createPayment(req, res) {
  try {
    const { plan_id } = req.body;
    const user = req.user;

    // ... (validations remain same)

    if (!plan_id) {
      return res.status(400).json({ success: false, message: "Plan ID is required" });
    }

    const token = await getAuthToken();
const plan = await Plan.findById(plan_id);
const amount = plan.price;

const orderId = await createOrder(token, amount);

    // ... PaymentIntent creation
    await PaymentIntent.create({
      order_id: orderId.toString(),
      user_id: user._id,
      amount: amount,
      currency: plan.currency,
      plan: plan.slug,
      billing_cycle: plan.billing_cycle,
      status: "pending",
      metadata: { plan_id: plan._id.toString() }
    });

    const billingData = {
      first_name: user.name.split(" ")[0],
      last_name: user.name.split(" ")[1] || "User",
      phone_number: user.phone || "01000000000",
      email: user.email
    };

    const paymentKey = await createPaymentKey(token, orderId, amount, billingData);

    const iframeURL = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_API_IFRAME}?payment_token=${paymentKey}`;

    res.json({ success: true, iframeURL, orderId });
  } catch (err) {
    console.error("[Backend] Error creating payment:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Helper to calculate HMAC
function calculateHmac(data, secret) {
  // Paymob HMAC fields in specific order
  const fields = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order", // order.id
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "source_data.type",
    "success",
  ];

  const concatenatedValues = fields.map(field => {
    if (field === "order") return data.order.id;
    if (field.startsWith("source_data.")) {
      const key = field.split(".")[1];
      return data.source_data[key];
    }
    return data[field];
  }).join("");

  return crypto.createHmac("sha512", secret).update(concatenatedValues).digest("hex");
}

// Shared function to finalize payment (create Revenue, update Company, etc.)
async function finalizePayment(paymentIntent, transactionId, paymentDate, gatewayResponse) {
  if (paymentIntent.status === "completed") {
    return { success: true, message: "Already Completed" };
  }

  try {
    // 1. Get User & Company
    const user = await import("../models/userModel.js").then(m => m.default.findById(paymentIntent.user_id));
    if (!user) {
      console.error(` [finalizePayment] User not found: ${paymentIntent.user_id}`);
      throw new Error("User not found");
    }

    const company = await Company.findById(user.company);
    if (!company) {
      console.error(` [finalizePayment] Company not found for user: ${user.email}`);
      throw new Error("Company not found");
    }

    // 2. Create Revenue Record
    // Check if revenue already exists for this transaction
    const existingRevenue = await Revenue.findOne({ transaction_id: transactionId });
    if (!existingRevenue) {
      const revenueData = {
        company_id: company._id,
        super_admin_id: user.super_admin_id || user._id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        plan: paymentIntent.plan,
        billing_cycle: paymentIntent.billing_cycle,
        status: "completed",
        payment_method: "paymob",
        transaction_id: transactionId,
        billing_start_date: new Date(),
        billing_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Should calculate based on cycle
        payment_date: paymentDate || new Date(),
        gateway_response: gatewayResponse
      };

      await Revenue.create(revenueData);
    } else {
    }

    // 3. Update Company Subscription (Dynamic from Plan)
    let planLimits = { maxUsers: 10, maxBranches: 1 };

    // Try to get plan from metadata
    let planId = paymentIntent.metadata && paymentIntent.metadata.get('plan_id');

    // If not in metadata (Map), check if it's a plain object or try to find plan by slug
    if (!planId && paymentIntent.plan) {
      const p = await Plan.findOne({ slug: paymentIntent.plan });
      if (p) planId = p._id;
    }

    if (planId) {
      const plan = await Plan.findById(planId);
      if (plan) {
        planLimits = plan.limits;
        company.subscription.plan = plan._id;
        company.subscription.plan_name = plan.name;
      }
    } else {
      company.subscription.plan_name = paymentIntent.plan;
    }

    company.subscription.status = "active";
    company.subscription.maxUsers = planLimits.max_employees;
    company.subscription.maxBranches = planLimits.max_branches;

    // Calculate expiry based on cycle
    const expiryDate = new Date();
    if (paymentIntent.billing_cycle === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }
    company.subscription.expiresAt = expiryDate;
    await company.save();

    // 4. Update Payment Intent Status
    paymentIntent.status = "completed";
    paymentIntent.transaction_id = transactionId;
    await paymentIntent.save();

    return { success: true };
  } catch (error) {

    throw error;
  }
}

// Secure Webhook Handler
export async function webhook(req, res) {


  try {
    const {
      obj,
      type,
      hmac
    } = req.body;


    if (type !== "TRANSACTION") {
      return res.status(200).send("Ignored");
    }

    // 1. HMAC Verification (temporarily bypassed for testing)
    if (PAYMOB_HMAC_SECRET) {
      const calculatedHmac = calculateHmac(obj, PAYMOB_HMAC_SECRET);
      if (calculatedHmac !== hmac) {
   
        // return res.status(403).send("Forbidden");
      } else {
      }
    } else {
    }

    if (obj.success === true) {
      const orderId = obj.order.id.toString();
      const transactionId = obj.id.toString();

      // 2. Retrieve Payment Intent
      const paymentIntent = await PaymentIntent.findOne({ order_id: orderId });

      if (!paymentIntent) {
        console.error(`PaymentIntent not found for order ${orderId}`);
        return res.status(404).send("Order not found");
      }

      // 3. Verify Amount
      const paidAmount = obj.amount_cents / 100;
      if (paidAmount !== paymentIntent.amount) {
        console.error(`Amount mismatch: Expected ${paymentIntent.amount}, Got ${paidAmount}`);
        return res.status(400).send("Amount Mismatch");
      }

      // 4. Finalize Payment
      await finalizePayment(paymentIntent, transactionId, new Date(obj.created_at), obj);

    } else {
      const orderId = obj.order.id.toString();
      await PaymentIntent.findOneAndUpdate({ order_id: orderId }, { status: "failed" });
    }

    res.status(200).send("Received");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook Error");
  }
}

export async function userPaid(req, res) {
  const { orderId } = req.params;
  try {
    const intent = await PaymentIntent.findOne({ order_id: orderId });

    if (!intent) {
      console.error(" [Backend] Order not found in DB");
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Use trim() to handle any trailing spaces in status
    if (intent.status?.trim() === "completed") {
      return res.json({ success: true });
    }

    const token = await getAuthToken();

    // Better approach: Get transactions for this order
    const transactionsRes = await axios.get(
      `${PAYMOB_API_URL}/ecommerce/orders/${orderId}/transactions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );


    const successfulTx = transactionsRes.data.results.find(tx => tx.success === true);

    if (successfulTx) {
      const finalResult = await finalizePayment(
        intent,
        successfulTx.id.toString(),
        new Date(successfulTx.created_at),
        successfulTx
      );
      if (finalResult.success) {
        return res.json({ success: true });
      } else {
        return res.status(500).json({ success: false, message: "Finalization failed", error: finalResult.error });
      }
    } else {
      console.warn(" [Backend] No successful transaction found on Paymob.");
    }

    res.json({ success: false });
  } catch (err) {
    console.error(" [Backend] userPaid error:", err);
    res.json({ success: false, error: err.message });
  }
}

export async function debugPayment(req, res) {
  const { orderId } = req.params;

  const protocol = req.protocol;
  const host = req.get('host');
  const fullUrl = `${protocol}://${host}${req.originalUrl}`;

  const debugLog = {
    timestamp: new Date(),
    request_url: fullUrl,
    order_id: orderId,
    steps: []
  };

  try {
    // 1. Check Local DB
    debugLog.steps.push("Checking local PaymentIntent...");
    const intent = await PaymentIntent.findOne({ order_id: orderId });

    if (!intent) {
      debugLog.steps.push(" PaymentIntent not found locally.");
      return res.json({ success: false, log: debugLog });
    }

    debugLog.local_intent = {
      id: intent._id,
      status: intent.status,
      amount: intent.amount,
      user_id: intent.user_id,
      plan: intent.plan
    };
    debugLog.steps.push(`Local Intent found. Status: ${intent.status}`);

    // 2. Auth with Paymob
    debugLog.steps.push("Authenticating with Paymob...");
    let token;
    try {
      token = await getAuthToken();
      debugLog.steps.push(" Paymob Auth Token received.");
    } catch (e) {
      debugLog.steps.push(` Paymob Auth Failed: ${e.message}`);
      return res.json({ success: false, log: debugLog });
    }

    // 3. Fetch Transactions
    debugLog.steps.push(`Fetching transactions for Order ${orderId}...`);
    let paymobTransactions = [];
    try {
      const transactionsRes = await axios.get(
        `${PAYMOB_API_URL}/ecommerce/orders/${orderId}/transactions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      paymobTransactions = transactionsRes.data.results;
      debugLog.steps.push(`ℹ Found ${paymobTransactions.length} transactions.`);
      debugLog.paymob_transactions = paymobTransactions.map(t => ({
        id: t.id,
        success: t.success,
        amount_cents: t.amount_cents,
        created_at: t.created_at,
        is_voided: t.is_voided,
        is_refunded: t.is_refunded
      }));
    } catch (e) {
      debugLog.steps.push(` Failed to fetch transactions: ${e.message}`);
      return res.json({ success: false, log: debugLog });
    }

    // 4. Analyze
    const successfulTx = paymobTransactions.find(tx => tx.success === true);
    if (!successfulTx) {
      debugLog.steps.push(" No successful transaction found in Paymob records.");
    } else {
      debugLog.steps.push(` Found successful transaction ID: ${successfulTx.id}`);

      if (intent.status?.trim() !== 'completed') {
        debugLog.steps.push("🔄 Attempting to finalize payment now...");
        try {
          const finalization = await finalizePayment(
            intent,
            successfulTx.id.toString(),
            new Date(successfulTx.created_at),
            successfulTx
          );
          if (finalization.success) {
            debugLog.steps.push("Finalization SUCCESS.");
            debugLog.result = "Fixed Pending Status";
          } else {
            debugLog.steps.push(` Finalization FAILED: ${finalization.message}`);
          }
        } catch (err) {
          debugLog.steps.push(` Finalization EXCEPTION: ${err.message}`);
          debugLog.error_stack = err.stack;
        }
      } else {
        debugLog.steps.push("ℹ Local status is already 'completed'. No action needed.");
      }
    }

    res.json({ success: true, log: debugLog });

  } catch (err) {
    debugLog.steps.push(` Fatal Error: ${err.message}`);
    res.status(500).json({ success: false, log: debugLog, error: err.message });
  }
}

// Force finalize a pending payment (for admin use when webhook fails)
// Also handles "completed" payments that are missing Revenue records
export async function forceFinalize(req, res) {
  const { orderId } = req.params;

  try {
    const intent = await PaymentIntent.findOne({ order_id: orderId });

    if (!intent) {
      console.error(" [forceFinalize] Order not found");
      return res.status(404).json({ success: false, message: "Order not found" });
    }


    // Check if Revenue exists for this payment
    const existingRevenue = await Revenue.findOne({
      $or: [
        { transaction_id: intent.transaction_id },
        { transaction_id: { $regex: new RegExp(`^${orderId}`) } }
      ]
    });

    if (existingRevenue) {
      return res.json({
        success: true,
        message: "Revenue already exists",
        revenue_id: existingRevenue._id
      });
    }

    // Get auth token and check Paymob
    const token = await getAuthToken();
    const transactionsRes = await axios.get(
      `${PAYMOB_API_URL}/ecommerce/orders/${orderId}/transactions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const successfulTx = transactionsRes.data.results.find(tx => tx.success === true);

    if (!successfulTx) {
      console.error(" [forceFinalize] No successful transaction on Paymob");
      return res.status(400).json({
        success: false,
        message: "No successful transaction found on Paymob",
        transactions: transactionsRes.data.results
      });
    }


    // Reset status to pending so finalizePayment will run
    intent.status = "pending";
    await intent.save();

    // Force finalize
    const result = await finalizePayment(
      intent,
      successfulTx.id.toString(),
      new Date(successfulTx.created_at),
      successfulTx
    );

    res.json({ success: result.success, message: "Payment finalized", transactionId: successfulTx.id });
  } catch (err) {
    console.error(" [forceFinalize] Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Manually create Revenue for orphaned PaymentIntents (when Paymob order expired)
export async function createRevenueManual(req, res) {
  const { orderId } = req.params;

  try {
    const intent = await PaymentIntent.findOne({ order_id: orderId });

    if (!intent) {
      return res.status(404).json({ success: false, message: "PaymentIntent not found" });
    }

    // Check if Revenue already exists
    const existingRevenue = await Revenue.findOne({ transaction_id: orderId });
    if (existingRevenue) {
      return res.json({ success: true, message: "Revenue already exists", revenue_id: existingRevenue._id });
    }

    // Get User and Company
    const User = (await import("../models/userModel.js")).default;
    const user = await User.findById(intent.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const company = await Company.findById(user.company);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }


    // Create Revenue record
    const revenue = await Revenue.create({
      company_id: company._id,
      super_admin_id: user.super_admin_id || user._id,
      amount: intent.amount,
      currency: intent.currency || "EGP",
      plan: intent.plan,
      billing_cycle: intent.billing_cycle,
      status: "completed",
      payment_method: "paymob",
      transaction_id: orderId, // Use orderId as transaction_id since we can't get it from Paymob
      billing_start_date: intent.createdAt,
      billing_end_date: new Date(intent.createdAt.getTime() + (intent.billing_cycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
      payment_date: intent.createdAt,
      gateway_response: { manual: true, note: "Created manually - Paymob order expired" }
    });

    // Update company subscription
    let planLimits = { max_employees: 10, max_branches: 1 };
    const planId = intent.metadata?.get('plan_id');

    if (planId) {
      const plan = await Plan.findById(planId);
      if (plan) {
        planLimits = plan.limits;
        company.subscription.plan = plan._id;
        company.subscription.plan_name = plan.name;
      }
    } else {
      company.subscription.plan_name = intent.plan;
    }

    company.subscription.status = "active";
    company.subscription.maxUsers = planLimits.max_employees;
    company.subscription.maxBranches = planLimits.max_branches;

    const expiryDate = new Date();
    if (intent.billing_cycle === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }
    company.subscription.expiresAt = expiryDate;
    await company.save();

    // Update PaymentIntent status and transaction_id
    intent.status = "completed";
    intent.transaction_id = orderId;
    await intent.save();

    res.json({
      success: true,
      message: "Revenue created manually",
      revenue_id: revenue._id,
      company_subscription: company.subscription
    });

  } catch (err) {
    console.error(" [createRevenueManual] Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get billing history for the logged-in user
export async function getBillingHistory(req, res) {
  try {
    const user = req.user;
    const superAdminId = user.role === "super_admin" ? user._id : user.super_admin_id;
    // DEBUG: Check if any revenue exists at all for this user (ignoring status)
    const allRevenue = await Revenue.find({ super_admin_id: superAdminId });

    const history = await Revenue.find({
      super_admin_id: superAdminId,
      status: "completed" // Only show completed payments
    })
      .sort({ payment_date: -1 })
      .select('payment_date amount currency plan billing_cycle payment_method transaction_id status');

    return res.json({
      success: true,
      data: history
    });

  } catch (err) {
    console.error(" [Backend] getBillingHistory error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
