import React, { useEffect, useState } from "react";
import { X, Building2, Users, DollarSign, Calendar, Mail, Phone, MapPin, ShieldCheck, ShieldOff, Loader } from "lucide-react";
import { platformService } from "../../api/services/platformService";
import { useTranslation } from "react-i18next";

const CompanyDetailsModal = ({ companyId, onClose, onToggleStatus }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const res = await platformService.getCompanyDetails(companyId);
                setData(res.data.data);
            } catch (err) {
                console.error("Error fetching company details:", err);
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchDetails();
        }
    }, [companyId]);

    if (!companyId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Building2 className="text-blue-600" />
                        {loading ? t('common.loading') : data?.name}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader className="animate-spin mb-2" size={32} />
                            <p>{t('common.loadingDetails') || "Loading details..."}</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <div className="text-blue-500 text-sm font-medium mb-1 flex items-center gap-1">
                                        <Users size={16} /> {t('platform.companies.details.employees') || "Total Employees"}
                                    </div>
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                        {data.stats.employees}
                                    </div>
                                </div>

                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                                    <div className="text-purple-500 text-sm font-medium mb-1 flex items-center gap-1">
                                        <Building2 size={16} /> {t('platform.companies.details.branches') || "Branches (Admins)"}
                                    </div>
                                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                        {data.stats.branches}
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                    <div className="text-emerald-500 text-sm font-medium mb-1 flex items-center gap-1">
                                        <DollarSign size={16} /> {t('platform.companies.details.revenue') || "Total Revenue"}
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                        {data.stats.revenue.toLocaleString()} {data.superAdmin?.currency || 'EGP'}
                                    </div>
                                </div>
                            </div>

                            {/* Info Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Subscription Info */}
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-200 mb-3 border-b border-slate-100 pb-2">
                                        {t('platform.companies.details.subscription') || "Subscription"}
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">{t('platform.companies.card.plan')}</span>
                                            <span className="font-medium bg-slate-100 dark:bg-slate-700 px-2 rounded">
                                                {data.subscription?.plan_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">{t('platform.companies.card.joined')}</span>
                                            <span className="font-medium">
                                                {new Date(data.createdAt).toLocaleDateString(i18n.language)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">{t('platform.companies.filters.status')}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${data.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                }`}>
                                                {data.isActive ? t('platform.companies.filters.active') : "Suspended"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Owner Info */}
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-200 mb-3 border-b border-slate-100 pb-2">
                                        {t('platform.companies.card.superAdmin') || "Owner Contact"}
                                    </h4>
                                    {data.superAdmin ? (
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                                    {data.superAdmin.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-slate-200">{data.superAdmin.name}</p>
                                                    <p className="text-xs text-slate-500">{data.superAdmin.position || "Owner"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Mail size={14} /> {data.superAdmin.email}
                                            </div>
                                            {data.superAdmin.phone && (
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <Phone size={14} /> {data.superAdmin.phone}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic">No owner info available</p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-6 mt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                                <button
                                    onClick={() => onToggleStatus(data._id, data.isActive)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${data.isActive
                                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                        }`}
                                >
                                    {data.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                                    {data.isActive ? t('platform.companies.actions.deactivate') : t('platform.companies.actions.activate')}
                                </button>

                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition"
                                >
                                    {t('common.close') || "Close"}
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center text-red-500 py-10">
                            Failed to load details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyDetailsModal;
