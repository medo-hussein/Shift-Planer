import axios from "axios";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_API_URL = process.env.PAYMOB_API_URL;
const PAYMOB_API_IFRAME = process.env.PAYMOB_API_IFRAME;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;

async function getAuthToken() {
  const res = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
    api_key: PAYMOB_API_KEY,
  });
  return res.data.token;
}
async function createOrder(token, amount) {
  const res = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
    auth_token: token,
    delivery_needed: false,
    amount_cents: amount * 100,
    currency: "EGP",
    items: [],
  });
  return res.data.id;
}
async function createPaymentKey(token, orderId, amount) {
  const res = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
    auth_token: token,
    amount_cents: amount * 100,
    expiration: 3600,
    order_id: orderId,
    billing_data: {
      first_name: "Customer",
      last_name: "User",
      phone_number: "01000000000",
      email: "example@gmail.com",
      country: "Egypt",
      city: "Cairo",
      street: "Test",
      building: "1",
      floor: "1",
      apartment: "1",
    },
    currency: "EGP",
    integration_id: PAYMOB_INTEGRATION_ID,
  });
  return res.data.token;
}
export async function createPayment(req, res) {
  try {
    const { amount } = req.body;
    const token = await getAuthToken();
    const orderId = await createOrder(token, amount);
    const paymentKey = await createPaymentKey(token, orderId, amount);

    const iframeURL = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_API_IFRAME}?payment_token=${paymentKey}`;

    res.json({ success: true, iframeURL, orderId });
  } catch (err) {
    console.error("Error creating payment:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function userPaid(req, res) {
  const { orderId } = req.params;
  try {
    const token = await getAuthToken();
    const result = await axios.get(
      `${PAYMOB_API_URL}/ecommerce/orders/${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(result.data);
    console.log("--------------------");
    console.log(result.data.is_paid);

    if (result.data && result.data.payment_status === "PAID") {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
}
