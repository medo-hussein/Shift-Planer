import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router";
import {
  Check,
  Loader2,
  CreditCard,
  RotateCw,
  History,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { planService } from "../../api/services/planService";
import { paymentService } from "../../api/services/paymentService";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DashboardSkeleton from "../../utils/DashboardSkeleton.jsx";

const BillingPage = () => {
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [searchParams] = useSearchParams();
  const { addToast: showToast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();

  const preSelectedPlanSlug = searchParams.get("plan");

  // Current subscription details
  const currentPlanName =
    user?.plan_name || user?.subscription?.plan_name || "Free";
  const status = user?.subscription?.status || "active";
  const expiresAt = user?.subscription?.expiresAt
    ? new Date(user.subscription.expiresAt).toLocaleDateString()
    : "Never";

  const fetchPlans = useCallback(async () => {
    try {
      const data = await planService.getPlans();
      let plansList = Array.isArray(data)
        ? data
        : data.success && Array.isArray(data.data)
        ? data.data
        : [];
      setPlans(plansList.sort((a, b) => a.price - b.price));
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      showToast("Failed to load plans", "error");
    } finally {
      setLoadingPlans(false);
    }
  }, [showToast]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await paymentService.getBillingHistory();
      if (response.success) {
        setHistory(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch billing history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchHistory();
  }, [fetchPlans, fetchHistory]);

  const handleSubscribe = async (plan) => {
    if (plan.price === 0) {
      showToast(t("subscription.alreadyOnFreePlan"), "info");
      return;
    }

    setProcessing(plan._id);
    try {
      const response = await paymentService.initiatePayment(plan._id);
      if (response.iframeURL) {
        window.location.href = response.iframeURL;
      } else {
        showToast(t("subscription.errors.paymentInitFailed"), "error");
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      showToast(
        err.response?.data?.message || t("subscription.errors.paymentFailed"),
        "error"
      );
    } finally {
      setProcessing(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };
    const icons = {
      active: <CheckCircle className="w-3 h-3 mr-1" />,
      completed: <CheckCircle className="w-3 h-3 mr-1" />,
      pending: <RotateCw className="w-3 h-3 mr-1 animate-spin" />,
      failed: <AlertCircle className="w-3 h-3 mr-1" />,
      expired: <XCircle className="w-3 h-3 mr-1" />,
    };
    if(loadingHistory && loadingPlans) return <DashboardSkeleton />

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status] || styles.expired
        }`}
      >
        {icons[status] || icons.expired}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleDownloadInvoice = async (record) => {
    // console.log("📄 [Invoice] Generating for record:", record);

    const doc = new jsPDF();
    const issueDate = new Date();

    // Helper to load image
    const loadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
      });
    };

    try {
      // Load Logo
      const logoUrl = "/icons/lightLogo.png";
      const logoImg = await loadImage(logoUrl);

      // Add Logo (Left side)
      doc.addImage(logoImg, "PNG", 14, 15, 30, 20); // x, y, width, height
    } catch (err) {
      console.warn("⚠️ [Invoice] Failed to load logo:", err);
      // Fallback text if logo fails
      doc.setFontSize(18);
      doc.text("Tadbir", 14, 25);
    }

    // Header Text (shifted down or right depending on logo)
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("INVOICE", 160, 20, { align: "right" }); // Moved to right

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Invoice #: ${
        record.transaction_id
          ? record.transaction_id.substring(0, 10).toUpperCase()
          : "N/A"
      }`,
      160,
      30,
      { align: "right" }
    );
    doc.text(
      `Payment Date: ${new Date(record.payment_date).toLocaleDateString()}`,
      160,
      35,
      { align: "right" }
    );
    doc.text(`Printed On: ${issueDate.toLocaleDateString()}`, 160, 40, {
      align: "right",
    });
    doc.text(`Status: ${record.status.toUpperCase()}`, 160, 45, {
      align: "right",
    });

    // User Company Info (Left side, under logo)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Tadbir", 14, 55);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Tanta, Egypt", 14, 60);
    doc.text("tadbersf@gmail.com", 14, 65);

    // Bill To (Right side or below)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Bill To:", 14, 80);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${user.name}`, 14, 87);
    doc.text(`${user.email}`, 14, 92);

    // Table
    autoTable(doc, {
      startY: 100,
      head: [["Description", "Billing Period", "Amount"]],
      body: [
        [
          `Subscription: ${record.plan} Plan`,
          `${
            record.billing_cycle === "yearly" ? "Yearly" : "Monthly"
          } Subscription`,
          `${record.amount} ${record.currency}`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total Amount:`, 140, finalY);
    doc.setFontSize(12);
    doc.font = "helvetica";
    doc.fontStyle = "bold";
    doc.text(`${record.amount} ${record.currency}`, 180, finalY, {
      align: "right",
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your business!", 105, 280, { align: "center" });

    doc.save(`Invoice_${record.transaction_id}.pdf`);
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-sky-600" />
          Billing & Subscription
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Manage your plan, check limits, and view payment history.
        </p>
      </div>

      {/* Current Plan Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Current Plan
            </h2>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPlanName}
              </h3>
              <StatusBadge status={status} />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {status === "active"
                ? `Renews on: ${expiresAt}`
                : "No active subscription"}
            </p>
          </div>
        </div>
      </div>

      {/* Plans Selection */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <RotateCw className="w-5 h-5 text-sky-600" />
          Available Plans
        </h2>
        {loadingPlans ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlanName === plan.name;
              return (
                <div
                  key={plan._id}
                  className={`relative rounded-xl p-6 transition-all duration-300 flex flex-col border ${
                    isCurrent
                      ? "border-sky-500 bg-sky-50 dark:bg-slate-800/50 ring-1 ring-sky-500"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                      CURRENT
                    </div>
                  )}
                  <div className="text-center mb-6 mt-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center mt-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {plan.price} <span className="text-sm">EGP</span>
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start text-sm text-gray-600 dark:text-gray-300"
                      >
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={
                      isCurrent || processing === plan._id || plan.price === 0
                    }
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-green-100 text-green-700 cursor-not-allowed"
                        : "bg-gray-900 text-white hover:bg-black dark:bg-sky-600 dark:hover:bg-sky-700"
                    }`}
                  >
                    {processing === plan._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      "Active Plan"
                    ) : (
                      "Upgrade"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Billing History */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <History className="w-5 h-5 text-sky-600" />
          Payment History
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loadingHistory ? (
            <div className="p-12 text-center text-gray-500">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No payment history found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                {/* Desktop Header */}
                <thead className="hidden md:table-header-group bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Invoice</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {history.map((record) => (
                    <tr
                      key={record._id}
                      className="
            block md:table-row
            p-4 md:p-0
            bg-white dark:bg-slate-800
            md:bg-transparent
            rounded-lg md:rounded-none
            mb-4 md:mb-0
            shadow md:shadow-none
            hover:bg-gray-50 dark:hover:bg-slate-700/50
            transition
          "
                    >
                      {/* Date */}
                      <td className="flex md:table-cell justify-between md:justify-start p-2 md:p-4">
                        <span className="md:hidden text-xs font-medium text-gray-400">
                          Date
                        </span>
                        <div className="text-right md:text-left">
                          <div className="text-gray-900 dark:text-gray-200">
                            {new Date(record.payment_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(record.payment_date).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="flex md:table-cell justify-between p-2 md:p-4">
                        <span className="md:hidden text-xs font-medium text-gray-400">
                          Description
                        </span>
                        <div className="text-right md:text-left">
                          <div className="font-medium text-gray-900 dark:text-white">
                            Subscription: {record.plan}
                          </div>
                          <div className="text-xs text-gray-400">
                            Tx: {record.transaction_id}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="flex md:table-cell justify-between p-2 md:p-4 font-mono">
                        <span className="md:hidden text-xs font-medium text-gray-400">
                          Amount
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {record.amount} {record.currency}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="flex md:table-cell justify-between p-2 md:p-4">
                        <span className="md:hidden text-xs font-medium text-gray-400">
                          Status
                        </span>
                        <StatusBadge status={record.status} />
                      </td>

                      {/* Invoice */}
                      <td className="flex md:table-cell justify-between p-2 md:p-4 md:text-right">
                        <span className="md:hidden text-xs font-medium text-gray-400">
                          Invoice
                        </span>
                        <button
                          onClick={() => handleDownloadInvoice(record)}
                          className="text-sky-600 hover:text-sky-700 p-2 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-full transition"
                          title="Download Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
