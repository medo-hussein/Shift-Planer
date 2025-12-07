import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { planService } from "../../api/services/planService";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const PricingSection = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await planService.getPlans();
                if (Array.isArray(data)) {
                    // Sort plans by price
                    const sortedPlans = data.sort((a, b) => a.price - b.price);
                    setPlans(sortedPlans);
                } else if (data.success && Array.isArray(data.data)) {
                    // Fallback in case controller changes to standard format
                    setPlans(data.data.sort((a, b) => a.price - b.price));
                }
            } catch (err) {
                console.error("Failed to fetch plans:", err);
                setError(t("pricing.failedToLoad"));
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, [t]);

    const handleSubscribe = (plan) => {
        if (isAuthenticated) {
            // If logged in, go to dashboard subscription page (placeholder for now)
            navigate("/dashboard/subscription");
        } else {
            // If not logged in, go to register with plan pre-selected
            navigate(`/register?plan=${plan.slug}`);
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-24 text-center text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-900" id="pricing">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t("pricing.title")}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        {t("pricing.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan._id}
                            className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 flex flex-col ${plan.slug.includes("starter") // Assuming starter is popular
                                ? "bg-white dark:bg-gray-800 ring-2 ring-sky-600 shadow-xl scale-105 z-10"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl"
                                }`}
                        >
                            {plan.slug.includes("starter") && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <span className="bg-sky-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                                        {t("pricing.mostPopular")}
                                    </span>
                                </div>
                            )}

                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 min-h-[40px]">
                                    {plan.description}
                                </p>
                                <div className="flex items-baseline justify-center mb-6">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                        {plan.price} <span className="text-xl">EGP</span>
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                                        /{plan.billing_cycle === 'month' ? t("pricing.perMonth") :
                                            plan.billing_cycle === 'year' ? t("pricing.perYear") :
                                                plan.billing_cycle}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center text-gray-600 dark:text-gray-300">
                                        <Check className="w-5 h-5 text-sky-600 mr-3 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan)}
                                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 mt-auto cursor-pointer ${plan.slug.includes("starter")
                                    ? "bg-sky-600 hover:bg-sky-700 text-white shadow-md hover:shadow-lg"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {plan.price === 0 ? t("pricing.getStartedFree") : t("pricing.subscribeNow")}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;