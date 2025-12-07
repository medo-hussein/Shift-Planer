import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router"; // Fixed import from 'react-router' to 'react-router-dom' if needed, but project uses 'react-router'
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { paymentService } from "../../api/services/paymentService";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const PaymentCallback = () => {
    const [status, setStatus] = useState("processing"); // processing, success, failed
    const [message, setMessage] = useState("Verifying payment...");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { refreshUser } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        const verifyPayment = async () => {
            console.log("👉 [Frontend Callback] URL Search Params:", searchParams.toString());
            // Paymob sends parameters: success (true/false), id (transaction), order (id), etc.
            const success = searchParams.get("success");
            const orderId = searchParams.get("order"); // Paymob uses 'order' or 'order_id' depending on integration, usually 'id' is transaction, 'order' is order id.
            const transactionId = searchParams.get("id"); // Transaction ID

            // If query params are missing, it might be a direct access or different format
            // Paymob v2/v3 might differ. Assuming standard redirection query params.
            // Documentation usually says: ?success=true&pending=false&id=123&order=456...
            console.log("👉 [Frontend Callback] Parsed - Success:", success, "OrderID:", orderId, "Match ID:", transactionId);

            if (!orderId) {
                console.error("❌ [Frontend Callback] Missing Order ID");
                setStatus("failed");
                setMessage(t("paymentCallback.errors.missingOrderId"));
                return;
            }

            if (success === "false") {
                console.warn("⚠️ [Frontend Callback] Payment declined/cancelled");
                setStatus("failed");
                setMessage(t("paymentCallback.errors.paymentDeclined"));
                return;
            }

            try {
                // Call verification endpoint
                // We reuse the existing endpoint: GET /api/paymentStatus/:orderId
                // This endpoint checks if 'completed', if not, it calls Paymob to verify and updates DB.
                console.log("👉 [Frontend Callback] Verifying status with backend for Order:", orderId);
                const response = await paymentService.checkPaymentStatus(orderId);
                console.log("👉 [Frontend Callback] Verification Response:", response);

                if (response.success) {
                    setStatus("success");
                    setMessage(t("paymentCallback.messages.verificationSuccess"));
                    addToast(t("paymentCallback.toasts.subscriptionActivated"), "success");

                    // Refresh user data to update the plan badge in navbar
                    console.log("👉 [Frontend Callback] Refreshing user data...");
                    await refreshUser();
                    console.log("✅ [Frontend Callback] User data refreshed");
                } else {
                    console.error("❌ [Frontend Callback] Backend returned success: false");
                    setStatus("failed");
                    setMessage(t("paymentCallback.errors.verificationFailed"));
                }
            } catch (error) {
                console.error("❌ [Frontend Callback] Verification error:", error);
                setStatus("failed");
                setMessage(error.response?.data?.message || t("paymentCallback.errors.serverError"));
            }
        };

        verifyPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleContinue = () => {
        navigate("/dashboard");
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center transition-all duration-300">
                {status === "processing" && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-sky-600 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {t("paymentCallback.status.processing")}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            {t("paymentCallback.messages.verifying")}
                        </p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {t("paymentCallback.status.success")}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            {message}
                        </p>
                        <button
                            onClick={handleContinue}
                            className="w-full py-3 px-6 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {t("paymentCallback.buttons.goToDashboard")}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {status === "failed" && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {t("paymentCallback.status.failed")}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            {message}
                        </p>
                        <button
                            onClick={handleContinue}
                            className="w-full py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-all"
                        >
                            {t("paymentCallback.buttons.returnToDashboard")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentCallback;