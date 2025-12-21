import React, { useEffect, useState } from "react";
import { planService } from "../../api/services/planService";
import { useLoading } from "../../contexts/LoaderContext";
import { useToast } from "../../hooks/useToast";
import {
    Plus, Edit2, Trash2, Check, X,
    Users, Building2, Power
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Plans() {
    const [plans, setPlans] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const { show, hide } = useLoading();
    const { addToast } = useToast();
    const { t, i18n } = useTranslation();

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        price: 0,
        billing_cycle: "monthly",
        limits: {
            max_branches: 1,
            max_employees: 5
        },
        features: "",
        is_active: true
    });

    const fetchPlans = async () => {
        try {
            show();
            // Use getAllPlans to see both inactive and active plans
            const data = await planService.getAllPlans();
            setPlans(data);
        } catch (err) {
            console.error("Error fetching plans:", err);
            addToast("Failed to load plans", "error");
        } finally {
            hide();
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                ...plan,
                features: plan.features.join('\n')
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: "",
                slug: "",
                description: "",
                price: 0,
                billing_cycle: "monthly",
                limits: { max_branches: 1, max_employees: 5 },
                features: "",
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            show();
            const payload = {
                ...formData,
                features: formData.features.split('\n').filter(f => f.trim() !== "")
            };

            if (editingPlan) {
                await planService.updatePlan(editingPlan._id, payload);
                addToast(t('platform.plans.alerts.updated'), "success");
            } else {
                await planService.createPlan(payload);
                addToast(t('platform.plans.alerts.created'), "success");
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (err) {
            console.error("Error saving plan:", err);
            addToast(err.response?.data?.message || "Failed to save plan", "error");
        } finally {
            hide();
        }
    };

    const handleToggleStatus = async (plan) => {
        try {
            await planService.togglePlanStatus(plan._id);
            addToast(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`, "success");
            fetchPlans();
        } catch (err) {
            addToast("Failed to update status", "error");
        }
    };

    const handleDeletePermanent = async (id) => {
        if (!window.confirm(t('platform.plans.alerts.confirmDelete'))) return;
        try {
            await planService.deletePlanPermanent(id);
            addToast(t('platform.plans.alerts.deleted'), "success");
            fetchPlans();
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to delete plan", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 lg:p-10 font-sans text-slate-800 dark:text-slate-200" dir={i18n.dir()}>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('platform.plans.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('platform.plans.subtitle')}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-blue-200"
                >
                    <Plus size={20} /> {t('platform.plans.createList')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan._id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all duration-300 relative ${!plan.is_active ? 'opacity-75 grayscale bg-gray-50 dark:bg-slate-900' : 'border-slate-100 dark:border-slate-700'}`}>

                        {/* Status Badge */}
                        <div className={`absolute top-4 right-4 rtl:left-4 rtl:right-auto text-xs font-bold px-2 py-1 rounded-full ${plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                            {plan.is_active ? t('platform.companies.filters.active') : t('platform.companies.filters.inactive')}
                        </div>

                        <div className="flex justify-between items-start mb-4 pr-16 rtl:pr-0 rtl:pl-16">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{plan.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
                            </div>
                        </div>

                        <div className="text-xl font-bold text-blue-600 mb-4">
                            {plan.price === 0 ? t('platform.plans.card.free') : `${plan.price} ${plan.currency}`}
                            <span className="text-xs text-slate-400 dark:text-slate-400 font-normal uppercase ml-1">/{plan.billing_cycle}</span>
                        </div>

                        <div className="space-y-3 border-t border-slate-50 dark:border-slate-700 pt-4 mb-6">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <Building2 size={16} className="text-blue-500" />
                                <span className="font-medium">{plan.limits.max_branches} {t('platform.plans.card.branches')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <Users size={16} className="text-purple-500" />
                                <span className="font-medium">{plan.limits.max_employees} {t('platform.plans.card.employees')}</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                                {plan.features.slice(0, 3).map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                                        <Check size={12} className="text-emerald-500" /> {feature}
                                    </div>
                                ))}
                                {plan.features.length > 3 && (
                                    <span className="text-xs text-slate-400 dark:text-slate-400 pl-5 rtl:pl-0 rtl:pr-5">+{plan.features.length - 3} {t('platform.plans.card.moreFeatures')}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                            <button
                                onClick={() => handleOpenModal(plan)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 text-sm font-medium transition"
                            >
                                <Edit2 size={16} /> {t('platform.plans.card.edit')}
                            </button>

                            {/* Toggle Status */}
                            <button
                                onClick={() => handleToggleStatus(plan)}
                                className={`p-2 rounded-lg border transition ${plan.is_active
                                    ? "border-amber-100 text-amber-500 hover:bg-amber-50"
                                    : "border-emerald-100 text-emerald-500 hover:bg-emerald-50"}`}
                                title={plan.is_active ? t('platform.plans.card.deactivate') : t('platform.plans.card.activate')}
                            >
                                <Power size={16} />
                            </button>

                            {/* Permanent Delete */}
                            <button
                                onClick={() => handleDeletePermanent(plan._id)}
                                className="p-2 rounded-lg border border-red-100 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 transition"
                                title={t('platform.plans.card.delete')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                {editingPlan ? t('platform.plans.modal.editTitle') : t('platform.plans.modal.createTitle')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('platform.plans.modal.name')}</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('platform.plans.modal.slug')}</label>
                                    <input
                                        type="text" required
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('platform.plans.modal.description')}</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    rows="2"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('platform.plans.modal.price')}</label>
                                    <input
                                        type="number" required min="0"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('platform.plans.modal.billingCycle')}</label>
                                    <select
                                        value={formData.billing_cycle}
                                        onChange={e => setFormData({ ...formData, billing_cycle: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('platform.plans.modal.maxBranches')}</label>
                                    <input
                                        type="number" required min="1"
                                        value={formData.limits.max_branches}
                                        onChange={e => setFormData({ ...formData, limits: { ...formData.limits, max_branches: Number(e.target.value) } })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('platform.plans.modal.maxEmployees')}</label>
                                    <input
                                        type="number" required min="1"
                                        value={formData.limits.max_employees}
                                        onChange={e => setFormData({ ...formData, limits: { ...formData.limits, max_employees: Number(e.target.value) } })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('platform.plans.modal.features')}</label>
                                <textarea
                                    value={formData.features}
                                    onChange={e => setFormData({ ...formData, features: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-sm"
                                    rows="5"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('platform.plans.modal.activePlan')}</label>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                >
                                    {t('platform.plans.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                                >
                                    {editingPlan ? t('platform.plans.modal.update') : t('platform.plans.modal.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
