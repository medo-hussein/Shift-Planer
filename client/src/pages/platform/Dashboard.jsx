import React, { useEffect, useState } from "react";
import { platformService } from "../../api/services/platformService";
import { useLoading } from "../../contexts/LoaderContext";
import {
    Building2, Users, DollarSign,
    ArrowRight, ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from "react-i18next";

export default function PlatformDashboard() {
    const [stats, setStats] = useState(null);
    const { show, hide } = useLoading();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';

    const fetchStats = async () => {
        try {
            show();
            const res = await platformService.getDashboardStats();
            setStats(res.data.data);
        } catch (err) {
            console.error("Error fetching platform stats:", err);
        } finally {
            hide();
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (!stats) return null;

    const { overview, recent_companies, revenue_by_plan } = stats;

    // Prepare chart data
    const chartData = revenue_by_plan.map(item => ({
        name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
        revenue: item.total,
        count: item.count
    }));

    const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981'];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 lg:p-10 font-sans text-slate-800 dark:text-slate-200" dir={i18n.dir()}>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('platform.dashboard.title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{t('platform.dashboard.subtitle')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title={t('platform.dashboard.stats.totalRevenue')}
                    value={`EGP ${overview.total_revenue.toLocaleString()}`}
                    icon={<DollarSign />}
                    color="emerald"
                />
                <StatCard
                    title={t('platform.dashboard.stats.totalCompanies')}
                    value={overview.total_companies}
                    icon={<Building2 />}
                    color="blue"
                />
                <StatCard
                    title={t('platform.dashboard.stats.activeCompanies')}
                    value={overview.active_companies}
                    icon={<ShieldCheck />}
                    color="indigo"
                />
                <StatCard
                    title={t('platform.dashboard.stats.totalUsers')}
                    value={overview.total_users}
                    icon={<Users />}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t('platform.dashboard.charts.revenueByPlan')}</h2>
                    <div className="h-80 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={50}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Companies */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('platform.dashboard.charts.recentSignups')}</h2>
                        <button
                            onClick={() => navigate('/companies')}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 rtl:flex-row-reverse"
                        >
                            {t('platform.dashboard.charts.viewAll')}
                            <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recent_companies.map((company) => (
                            <div key={company._id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
                                        {company.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{company.name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(company.createdAt).toLocaleDateString(i18n.language)}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${company.isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-red-50 text-red-700 border-red-100"
                                    }`}>
                                    {company.isActive ? t('platform.companies.filters.active') : t('platform.companies.filters.inactive')}
                                </span>
                            </div>
                        ))}

                        {recent_companies.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">{t('platform.dashboard.charts.noCompanies')}</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-start">
                <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                    Revenue: <span className="font-semibold">EGP {payload[0].value.toLocaleString()}</span>
                </p>
                {payload[0].payload.count !== undefined && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Subscribers: {payload[0].payload.count}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

function StatCard({ title, value, icon, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 ring-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
        indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
        orange: "bg-orange-50 text-orange-600 ring-orange-100",
    };

    const selectedColor = colors[color] || colors.blue;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ring-4 ring-opacity-30 ${selectedColor}`}>
                    {React.cloneElement(icon, { size: 24 })}
                </div>
            </div>
            <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">{value}</h3>
                <p className="text-sm font-medium text-slate-400 dark:text-slate-400">{title}</p>
            </div>
        </div>
    );
}
