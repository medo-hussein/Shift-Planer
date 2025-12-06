import React, { useEffect, useState } from "react";
import { dashboardService } from "../../api/services/admin/dashboardService";
import { useLoading } from "../../contexts/LoaderContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";
import {
  Users,
  CheckCircle2,
  XCircle,
  PieChart,
  CalendarClock,
  FileText,
  TrendingUp,
  Zap,
  RotateCcw,
  Clock,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const { show, hide } = useLoading();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchAllData = async () => {
    try {
      show();

      // Fetch both endpoints in parallel
      const [dashboardRes, statsRes] = await Promise.all([
        dashboardService.getDashboard(),
        dashboardService.getDashboardStats(),
      ]);

      setDashboardData(dashboardRes.data.data);
      setStatsData(statsRes.data.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (!dashboardData || !statsData) return null;

  const { branch: dashboardBranch, today, recent_employees } = dashboardData;
  const { branch: statsBranch, this_week, upcoming, reports } = statsData;

  // Merge branch data
  const mergedBranchData = {
    ...dashboardBranch,
    ...statsBranch,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 lg:p-10 font-sans text-slate-800 dark:text-slate-100">
      {/* HERO SECTION */}
      <div className="relative rounded-3xl overflow-hidden bg-[#112D4E] dark:bg-slate-800 shadow-lg mb-10 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Briefcase size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {t("dashboard.branch")}: {dashboardBranch?.name}
                </h1>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              {t("dashboard.welcome")}, {user?.name?.split(" ")[0] || t("dashboard.admin")}
            </h2>

            <p className="text-blue-100 text-lg max-w-2xl">
              {t("dashboard.hero.description")}{" "}
              <span className="font-bold text-white">
                {mergedBranchData?.total_employees} {t("dashboard.hero.employees")}
              </span>{" "}
              ({dashboardBranch?.active_employees} {t("dashboard.hero.active")}) {t("dashboard.hero.inBranch")}.
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-sm">
                <TrendingUp size={16} className="text-emerald-400" />
                <span>
                  {t("dashboard.hero.attendanceRate")}: {mergedBranchData?.attendance_rate}%
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-sm">
                <Clock size={16} className="text-yellow-400" />
                <span>{t("dashboard.hero.todaysShifts")}: {today?.shifts || 0}</span>
              </div>

              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-sm">
                <Zap size={16} className="text-blue-400" />
                <span>{t("dashboard.branch")}: {dashboardBranch?.name}</span>
              </div>
            </div>
          </div>

          <button
            onClick={fetchAllData}
            className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-300 shadow-sm hover:rotate-180"
            title={t("dashboard.buttons.refresh")}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* STATS GRID - 6 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        <StatCard
          title={t("dashboard.stats.totalEmployees")}
          value={mergedBranchData?.total_employees}
          subValue={`${dashboardBranch?.active_employees} ${t("dashboard.stats.active")}`}
          icon={<Users />}
          color="blue"
        />

        <StatCard
          title={t("dashboard.stats.presentToday")}
          value={mergedBranchData?.present_today}
          icon={<CheckCircle2 />}
          color="emerald"
        />

        <StatCard
          title={t("dashboard.stats.absentToday")}
          value={mergedBranchData?.absent_today}
          icon={<XCircle />}
          color="red"
        />

        <StatCard
          title={t("dashboard.stats.attendanceRate")}
          value={`${mergedBranchData?.attendance_rate}%`}
          icon={<PieChart />}
          color="purple"
        />

        <StatCard
          title={t("dashboard.stats.todaysShifts")}
          value={today?.shifts || 0}
          icon={<CalendarClock />}
          color="orange"
        />

        <StatCard
          title={t("dashboard.stats.pendingShifts")}
          value={upcoming?.pending_shifts || 0}
          icon={<Clock />}
          color="indigo"
        />
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - WEEKLY STATS */}
        <div className="lg:col-span-2 space-y-8">
          {/* WEEKLY SUMMARY CARD */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {t("dashboard.weekly.title")}
              </h2>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {t("dashboard.weekly.label")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WeeklyItem
                label={t("dashboard.weekly.totalHours")}
                value={this_week?.total_hours}
                icon={<Clock className="text-blue-600" />}
              />
              <WeeklyItem
                label={t("dashboard.weekly.overtimeHours")}
                value={this_week?.total_overtime}
                icon={<TrendingUp className="text-orange-600" />}
              />
              <WeeklyItem
                label={t("dashboard.weekly.avgHoursPerDay")}
                value={this_week?.average_hours}
                icon={<PieChart className="text-purple-600" />}
              />
            </div>
          </div>

          {/* RECENT EMPLOYEES CARD */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {t("dashboard.recentEmployees.title")}
              </h2>
              <button
                onClick={() => navigate("/employees")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {t("dashboard.buttons.viewAll")} →
              </button>
            </div>

            <div className="space-y-4">
              {recent_employees?.slice(0, 5).map((employee) => (
                <div
                  key={employee._id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* ✅ Image Handling */}
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-blue-50 dark:bg-slate-700 flex items-center justify-center border border-slate-100 dark:border-slate-600">
                      {employee.avatar ? (
                        <img
                          src={employee.avatar}
                          alt={employee.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                          {employee.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {employee.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {employee.position || t("dashboard.recentEmployees.defaultPosition")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      employee.is_active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {employee.is_active 
                      ? t("dashboard.recentEmployees.active") 
                      : t("dashboard.recentEmployees.inactive")
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - ADDITIONAL STATS */}
        <div className="space-y-8">
          {/* REPORTS CARD */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <FileText
                  className="text-blue-600 dark:text-blue-400"
                  size={24}
                />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  {t("dashboard.reports.title")}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("dashboard.reports.subtitle")}
                </p>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {reports?.generated_this_month || 0}
            </p>
            <button
              onClick={() => navigate("/reports")}
              className="w-full mt-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg font-medium transition-colors"
            >
              {t("dashboard.buttons.generateReport")}
            </button>
          </div>

          {/* TODAY'S SUMMARY CARD */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
              {t("dashboard.todaysSummary.title")}
            </h3>

            <div className="space-y-3">
              <SummaryItem
                label={t("dashboard.todaysSummary.attendance")}
                value={today?.attendance || 0}
                color="blue"
              />
              <SummaryItem
                label={t("dashboard.todaysSummary.pendingShifts")}
                value={today?.pending_shifts || 0}
                color="orange"
              />
              <SummaryItem
                label={t("dashboard.todaysSummary.activeEmployees")}
                value={dashboardBranch?.active_employees || 0}
                color="emerald"
              />
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
              {t("dashboard.quickActions.title")}
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/employees")}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-left dark:text-slate-100"
              >
                <UserPlus size={20} className="text-blue-600" />
                <span className="font-medium">{t("dashboard.quickActions.addEmployee")}</span>
              </button>

              <button
                onClick={() => navigate("/schedule")}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-left dark:text-slate-100"
              >
                <CalendarClock size={20} className="text-orange-600" />
                <span className="font-medium">{t("dashboard.quickActions.manageShifts")}</span>
              </button>

              <button
                onClick={() => navigate("/reports")}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-left dark:text-slate-100"
              >
                <FileText size={20} className="text-purple-600" />
                <span className="font-medium">{t("dashboard.quickActions.viewReports")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ COMPONENTS ------------------ */

function WeeklyItem({ label, value, icon }) {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
      <div className="mb-3 p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {value || 0} {label === t("dashboard.weekly.totalHours") || label === t("dashboard.weekly.overtimeHours") ? t("dashboard.units.hours") : ""}
      </p>
    </div>
  );
}

function SummaryItem({ label, value, color }) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
    orange:
      "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30",
    emerald:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
    purple:
      "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses[color]}`}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, color }) {
  const { t } = useTranslation();
  
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-blue-100 dark:ring-blue-800",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-800",
    purple:
      "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 ring-purple-100 dark:ring-purple-800",
    orange:
      "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 ring-orange-100 dark:ring-orange-800",
    red: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-red-100 dark:ring-red-800",
    indigo:
      "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-indigo-100 dark:ring-indigo-800",
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md hover:-translate-y-1 duration-300">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-xl ring-4 ring-opacity-30 ${colors[color]}`}
        >
          {React.cloneElement(icon, { size: 20 })}
        </div>

        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
          {t("dashboard.live")}
        </span>
      </div>

      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
        {value || 0}
      </h3>
      {subValue && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
          {subValue}
        </p>
      )}
      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
        {title}
      </p>
    </div>
  );
}