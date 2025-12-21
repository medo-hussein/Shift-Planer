
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DollarSign,
    Calendar,
    Printer,
    TrendingUp,
    Users,
    Clock,
    AlertCircle
} from 'lucide-react';
import api from '../../api/apiClient';
import { toast } from 'react-hot-toast'; // We might replace this with Alert service if strictly following standards, but user mentioned Swal for confirmations.
import Swal from 'sweetalert2';
import DashboardSkeleton from '../../utils/DashboardSkeleton';
import { Alert } from '../../utils/alertService';

const Payroll = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [payrollData, setPayrollData] = useState(null);
    const [period, setPeriod] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/attendance/payroll?start_date=${period.start}&end_date=${period.end}`);
            setPayrollData(response.data);
        } catch (error) {
            console.error(error);
            Alert.error(t('admin.payroll.errors.fetchFailed') || 'Failed to fetch payroll data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, [period.start, period.end]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <DashboardSkeleton />;
    if (!payrollData) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 lg:p-10 font-sans dark:text-slate-100" dir={i18n.dir()}>
            <div className="max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                            {t('Smart Payroll Estimator')}
                        </h1>
                        <p className="text-gray-500 mt-1 dark:text-gray-400">
                            {t('Automated salary calculations based on attendance & overtime')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={period.start}
                            onChange={(e) => setPeriod(prev => ({ ...prev, start: e.target.value }))}
                            className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                            type="date"
                            value={period.end}
                            onChange={(e) => setPeriod(prev => ({ ...prev, end: e.target.value }))}
                            className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        />
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                        >
                            <Printer size={18} />
                            <span>{t('Print Report')}</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Total Payroll Cost')}</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {payrollData.total_payroll_cost.toLocaleString()} {payrollData.currency}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Total Employees')}</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {payrollData.report.length}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                                <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Pending Overtime')}</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {payrollData.report.reduce((sum, item) => sum + item.financials.overtime_pay, 0).toLocaleString()} {payrollData.currency}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Employee Salary Breakdown')}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Employee')}</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Rate / Hr')}</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Regular Hrs')}</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Overtime (x1.5)')}</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 text-right">{t('Total Pay')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {payrollData.report.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                                    {item.avatar ? (
                                                        <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        item.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.position || 'Employee'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {item.hourly_rate > 0 ? (
                                                <span>{item.hourly_rate} {item.currency}</span>
                                            ) : (
                                                <span className="text-amber-500 text-xs flex items-center gap-1">
                                                    <AlertCircle size={14} /> Not Set
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {item.stats.regular_hours} h
                                            <div className="text-xs text-slate-400">{item.financials.base_pay.toLocaleString()} {item.currency}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={item.stats.overtime_hours > 0 ? "text-emerald-600 font-medium" : "text-slate-400"}>
                                                {item.stats.overtime_hours} h
                                            </span>
                                            <div className="text-xs text-slate-400">{item.financials.overtime_pay.toLocaleString()} {item.currency}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                                                {item.financials.total_salary.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-slate-400 ml-1">{item.currency}</span>
                                        </td>
                                    </tr>
                                ))}

                                {payrollData.report.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                            {t('No data found for this period')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payroll;
