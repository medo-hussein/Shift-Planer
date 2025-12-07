import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Check, Loader2, CreditCard } from "lucide-react";
import { planService } from "../../api/services/planService";
import { initiatePayment } from "../../api/services/paymentService";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";

const SubscriptionPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [searchParams] = useSearchParams();
    const { addToast: showToast } = useToast();
    const { t } = useTranslation();

    const preSelectedPlanSlug = searchParams.get("plan");

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await planService.getPlans();
                let plansList = [];
                if (Array.isArray(data)) {
                    plansList = data;
                } else if (data.success && Array.isArray(data.data)) {
                    plansList = data.data;
                }
                setPlans(plansList.sort((a, b) => a.price - b.price));
            } catch (err) {
                console.error("Failed to fetch plans:", err);
                showToast(t("subscription.errors.failedToLoad"), "error");
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, [t]);

    const handleSubscribe = async (plan) => {
        console.log("👉 [Frontend] User clicked Subscribe for plan:", plan.name, "ID:", plan._id);

        if (plan.price === 0) {
            showToast(t("subscription.alreadyOnFreePlan"), "info");
            return;
        }

        setProcessing(plan._id);
        try {
            console.log("👉 [Frontend] Calling initiatePayment...");
            const response = await initiatePayment(plan._id);
            console.log("👉 [Frontend] initiatePayment response:", response);

            if (response.iframeURL) {
                console.log("👉 [Frontend] Redirecting to Iframe:", response.iframeURL);
                window.location.href = response.iframeURL; // Redirect to Paymob
            } else {
                console.error("❌ [Frontend] No iframeURL in response");
                showToast(t("subscription.errors.paymentInitFailed"), "error");
            }
        } catch (err) {
            console.error("❌ [Frontend] Payment initiation error:", err);
            showToast(err.response?.data?.message || t("subscription.errors.paymentFailed"), "error");
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 min-h-screen dark:bg-slate-800">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("subscription.title")}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {t("subscription.subtitle")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isPreSelected = preSelectedPlanSlug === plan.slug;

                    return (
                        <div
                            key={plan._id}
                            className={`relative rounded-xl p-6 transition-all duration-300 flex flex-col ${isPreSelected
                                ? "bg-white dark:bg-gray-800 ring-2 ring-sky-600 shadow-xl scale-105 z-10"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                                }`}
                        >
                            {isPreSelected && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                        {t("subscription.selected")}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline justify-center mt-2">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {plan.price} <span className="text-lg">EGP</span>
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                                        /{plan.billing_cycle === 'month' ? t("pricing.perMonth") :
                                            plan.billing_cycle === 'year' ? t("pricing.perYear") :
                                                plan.billing_cycle}
                                    </span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 min-h-[40px]">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                                        <Check className="w-4 h-4 text-sky-600 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan)}
                                disabled={processing === plan._id}
                                className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isPreSelected || plan.price > 0
                                    ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                {processing === plan._id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t("subscription.processing")}
                                    </>
                                ) : plan.price === 0 ? (
                                    t("subscription.currentPlan")
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        {t("subscription.subscribeButton")}
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SubscriptionPage;