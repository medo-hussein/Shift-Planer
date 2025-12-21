import { useState, useEffect } from "react";
import { employeeService } from "../../api/services/employeeService";
import { useTranslation } from "react-i18next";
import {
    DollarSign,
    Calendar,
    Clock,
    Download,
    Printer,
    TrendingUp,
    AlertCircle
} from "lucide-react";
import DashboardSkeleton from "../../utils/DashboardSkeleton";

export default function Payslip() {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const fetchPayslip = async () => {
        try {
            setLoading(true);
            // Calculate start and end of selected month
            const date = new Date(selectedDate);
            const start_date = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
            const end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const res = await employeeService.getMyPayslip({ start_date, end_date });
            setData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayslip();
    }, [selectedDate]);

    const handlePrint = () => {
        window.print();
    };

    if (loading && !data) return <DashboardSkeleton />;

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
            <div className="text-slate-400 dark:text-slate-300">Loading Payslip...</div>
        </div>
    );

    const { employee, period, summary, financials, breakdown } = data;

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200 print:bg-white print:p-0">
            <div className="max-w-4xl mx-auto print:max-w-none">

                {/* Header & Controls (Hidden in Print) */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 print:hidden">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <DollarSign className="text-emerald-500" />
                            {t("payslip.title") || "My Payslip"}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            {t("payslip.subtitle") || "View your estimated earnings and attendance breakdown"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <input
                            type="month"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition"
                        >
                            <Printer size={18} />
                            <span>{t("common.print") || "Print"}</span>
                        </button>
                    </div>
                </div>

                {/* Payslip Card (The Printable Area) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden print:shadow-none print:border-none print:rounded-none">

                    {/* Slip Header */}
                    <div className="bg-slate-900 text-white p-8 print:bg-slate-100 print:text-black">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-bold mb-1">{t("payslip.header") || "PAYSLIP"}</h2>
                                <p className="opacity-80 text-sm uppercase tracking-wider">
                                    {new Date(period.start).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">{employee.name}</p>
                                <p className="opacity-80 text-sm">{employee.position}</p>
                                <p className="opacity-60 text-xs">{employee.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">

                        {/* Financial Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/30 print:border-gray-200">
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                                    {t("payslip.totalEstimated") || "Total Estim. Earning"}
                                </p>
                                <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                    {data.currency} {financials.total_earning.toLocaleString()}
                                </p>
                                <p className="text-xs text-emerald-500/80 mt-2">
                                    {t("payslip.disclaimer") || "*Before tax deductions"}
                                </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30 print:border-gray-200">
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                                    {t("payslip.basePay") || "Base Pay"}
                                </p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {data.currency} {financials.base_pay.toLocaleString()}
                                </p>
                                <p className="text-xs text-blue-500/80 mt-2 flex items-center gap-1">
                                    <Clock size={12} /> {summary.regular_hours} {t("payslip.regularHours") || "Regular Hours"}
                                </p>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border border-orange-100 dark:border-orange-800/30 print:border-gray-200">
                                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">
                                    {t("payslip.overtimePay") || "Overtime Pay"}
                                </p>
                                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                    {data.currency} {financials.overtime_pay.toLocaleString()}
                                </p>
                                <p className="text-xs text-orange-500/80 mt-2 flex items-center gap-1">
                                    <TrendingUp size={12} /> {summary.overtime_hours} {t("payslip.overtimeHours") || "Overtime Hours (1.5x)"}
                                </p>
                            </div>

                        </div>

                        {/* Attendance Breakdown (Condensed for Print) */}
                        <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <Calendar size={18} /> {t("payslip.attendanceBreakdown") || "Attendance Breakdown"}
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-xs font-bold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">{t("payslip.table.date") || "Date"}</th>
                                        <th className="px-4 py-3">{t("payslip.table.status") || "Status"}</th>
                                        <th className="px-4 py-3">{t("payslip.table.checkIn") || "Check In"}</th>
                                        <th className="px-4 py-3">{t("payslip.table.checkOut") || "Check Out"}</th>
                                        <th className="px-4 py-3 text-right">{t("payslip.table.totalHours") || "Total Hours"}</th>
                                        <th className="px-4 py-3 text-right rounded-r-lg">{t("payslip.table.overtime") || "Overtime"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {breakdown.length > 0 ? (
                                        breakdown.map((record, index) => (
                                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                    {new Date(record.date).toLocaleDateString(i18n.language)}
                                                </td>
                                                <td className="px-4 py-3 capitalize">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${record.status === 'present'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {record.check_in ? new Date(record.check_in).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {record.check_out ? new Date(record.check_out).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold">
                                                    {record.hours ? record.hours.toFixed(2) : '0.00'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400 font-bold">
                                                    {record.overtime > 0 ? `+${record.overtime.toFixed(2)}` : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                                                {t("payslip.noRecords") || "No attendance records found for this period."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Print Footer */}
                        <div className="hidden print:block mt-12 pt-8 border-t border-gray-200">
                            <p className="text-center text-xs text-gray-500">
                                {t("payslip.generatedBy") || "Generated by ShiftPlanner System on"} {new Date().toLocaleString()}
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
