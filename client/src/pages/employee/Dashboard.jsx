import React, { useEffect, useState } from "react";
import { employeeService } from "../../api/services/employeeService";
import { useLoading } from "../../contexts/LoaderContext";
import {
  Clock,
  Calendar,
  TrendingUp,
  User,
  MapPin,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const { show, hide } = useLoading();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        show();
        const res = await employeeService.getDashboard();
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        hide();
      }
    };
    fetchData();
  }, []);

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-slate-400 dark:text-slate-300">{t("employeeDashboard.loading")}</div>
    </div>
  );

  const { today, weekly, branch, upcoming } = data;

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{t("employeeDashboard.title")}</h1>
        </header>

        {/* 1. Today's Status Card */}
        <div className="bg-white dark:bg-slate-800/60 dark:border-slate-700 p-6 rounded-2xl shadow-md border border-slate-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${today.clocked_in ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"}`}>
              <Clock size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {today.clocked_in ? t("employeeDashboard.status.clockedIn") : t("employeeDashboard.status.clockedOut")}
              </h2>
              <p className="text-slate-500 dark:text-slate-300 text-sm">
                {t("employeeDashboard.status.currentStatus")}: <span className="font-medium capitalize">{today.current_status}</span>
              </p>
            </div>
          </div>

          {today.current_shift ? (
            <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 px-6 py-3 rounded-xl border border-blue-100 dark:border-blue-700 text-center">
              <p className="text-xs text-blue-600 dark:text-blue-200 uppercase font-bold mb-1">
                {t("employeeDashboard.currentShift")}
              </p>
              <p className="text-blue-900 dark:text-blue-50 font-bold">
                {formatTime(today.current_shift.start_date_time, i18n.language)} - {formatTime(today.current_shift.end_date_time, i18n.language)}
              </p>
            </div>
          ) : (
            <div className="text-slate-400 dark:text-slate-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> <span>{t("employeeDashboard.noActiveShift")}</span>
            </div>
          )}
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title={t("employeeDashboard.stats.weeklyHours")} 
            value={`${(weekly.total_hours || 0).toFixed(1)}h`} 
            icon={<Clock />} 
            color="blue" 
          />
          <StatCard 
            title={t("employeeDashboard.stats.overtime")} 
            value={`${(weekly.overtime || 0).toFixed(1)}h`} 
            icon={<TrendingUp />} 
            color="orange" 
          />
          <StatCard 
            title={t("employeeDashboard.stats.daysPresent")} 
            value={`${weekly.present_days || 0} / ${weekly.total_days || 0}`} 
            icon={<Calendar />} 
            color="emerald" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* 3. Upcoming Shifts */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600 dark:text-blue-300"/> {t("employeeDashboard.upcomingShifts")}
            </h3>
            <div className="space-y-4">
              {upcoming.shifts && upcoming.shifts.length > 0 ? upcoming.shifts.map(shift => (
                <div key={shift._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 min-w-[60px]">
                      <p className="text-xs text-slate-500 dark:text-slate-300 uppercase">
                        {new Date(shift.start_date_time).toLocaleDateString(i18n.language, {weekday: 'short'})}
                      </p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {new Date(shift.start_date_time).getDate()}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-100">
                        {shift.title || t("employeeDashboard.shift.defaultTitle")}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
                        <Clock size={10} /> {formatTime(shift.start_date_time, i18n.language)} - {formatTime(shift.end_date_time, i18n.language)}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-50 text-xs font-bold rounded-full capitalize">
                    {shift.shift_type}
                  </span>
                </div>
              )) : (
                <p className="text-slate-400 dark:text-slate-300 text-center py-4">
                  {t("employeeDashboard.noUpcomingShifts")}
                </p>
              )}
            </div>
          </div>

          {/* 4. Branch Info */}
          <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 h-fit">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-purple-600 dark:text-purple-300"/> {t("employeeDashboard.myTeam")}
            </h3>

            <div className="mb-4">
               <p className="text-xs text-slate-400 dark:text-slate-300 uppercase font-bold">
                 {t("employeeDashboard.branch.title")}
               </p>
               <p className="text-lg font-medium text-slate-700 dark:text-slate-100 flex items-center gap-2">
                 <MapPin size={16} className="text-slate-400 dark:text-slate-300"/> {branch.name || t("employeeDashboard.branch.defaultName")}
               </p>
            </div>

            {branch.admin && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                 <p className="text-xs text-slate-400 dark:text-slate-300 uppercase font-bold mb-2">
                   {t("employeeDashboard.branch.manager")}
                 </p>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center font-bold">
                      {branch.admin.name?.charAt(0) || "B"}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-100">{branch.admin.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{branch.admin.email}</p>
                   </div>
                 </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
    const { t } = useTranslation();
    
    const colors = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
    };
    return (
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colors[color]} flex items-center justify-center`}>
              {icon}
            </div>
            <div>
                <p className="text-slate-400 dark:text-slate-300 text-xs font-bold uppercase">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    );
}

function formatTime(dateString, locale = 'en-US') {
  try {
    return new Date(dateString).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "-";
  }
}