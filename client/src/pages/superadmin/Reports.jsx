import { useEffect, useState } from "react";
import { superAdminService } from "../../api/services/superAdminService";
import { 
  Calendar, Filter, Building, Eye, BarChart2, Clock, 
  ChevronLeft, ChevronRight 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ReportDetailsModal from "./ReportDetailsModal"; 
import DashboardSkeleton from "../../utils/DashboardSkeleton.jsx";

export default function SystemReports() {
  const [reports, setReports] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 6; 

  const { t, i18n } = useTranslation();

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = { 
        page, 
        limit,
        ...(filterType && { type: filterType }) 
      };
      
      const res = await superAdminService.getSystemReports(params);
      
      setReports(res.data.data || []);
      
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch (err) {
      console.error(t("systemReports.errors.fetchFailed"), err);
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, filterType]);

  useEffect(() => {
    setPage(1);
  }, [filterType]);

  if(loading) return <DashboardSkeleton />

  const getStatusColor = (type) => {
    switch (type) {
      case 'attendance': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shift': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'attendance': return t("systemReports.types.attendance");
      case 'shift': return t("systemReports.types.shift");
      default: return t("systemReports.types.other");
    }
  };

  const renderQuickStats = (report) => {
    const data = report.data || {};
    
    if (report.type === 'attendance') {
      return (
        <div className="flex gap-4 mt-3 mb-2">
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t("systemReports.stats.attendanceRate")}</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{data.attendance_rate || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t("systemReports.stats.present")}</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{data.summary?.present || data.present_count || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t("systemReports.stats.late")}</p>
            <p className="text-sm font-bold text-amber-500 dark:text-amber-400">{data.summary?.late || data.late_count || 0}</p>
          </div>
        </div>
      );
    }

    if (report.type === 'shift') {
      return (
        <div className="flex gap-4 mt-3 mb-2">
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t("systemReports.stats.totalShifts")}</p>
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{data.total_shifts || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t("systemReports.stats.completed")}</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{data.by_status?.completed || 0}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("systemReports.title")}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t("systemReports.subtitle")}</p>
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
          <select 
            className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3F72AF] cursor-pointer bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">{t("systemReports.filters.allTypes")}</option>
            <option value="attendance">{t("systemReports.types.attendance")}</option>
            <option value="shift">{t("systemReports.types.shift")}</option>
          </select>
        </div>
      </div>

      {reports.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition flex flex-col h-full">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(report.type)}`}>
                    {report.type === 'attendance' ? <Clock size={20} /> : 
                     report.type === 'performance' ? <BarChart2 size={20} /> : 
                     <Calendar size={20} />}
                  </div>
                  <button 
                    onClick={() => setSelectedReport(report)}
                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1"
                    aria-label={t("systemReports.buttons.viewDetails")}
                  >
                    <Eye size={14} /> {t("systemReports.buttons.viewDetails")}
                  </button>
                </div>

                {/* Content */}
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 line-clamp-1" title={report.title}>{report.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {t("systemReports.generatedOn")} {new Date(report.createdAt).toLocaleDateString(i18n.language)}
                </p>

                {/* Report Type Badge */}
                <div className="mb-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(report.type)}`}>
                    {getReportTypeLabel(report.type)}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4">
                  {renderQuickStats(report)}
                </div>

                {/* Footer Info */}
                <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-700 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Building size={14} className="text-slate-400 dark:text-slate-500" />
                    <span className="truncate text-xs">{report.generated_by_admin_id?.branch_name || t("systemReports.unknownBranch")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-xs">
                      {new Date(report.start_date).toLocaleDateString(i18n.language)} - {new Date(report.end_date).toLocaleDateString(i18n.language)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pb-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label={t("systemReports.pagination.previous")}
              >
                <ChevronLeft size={20} />
              </button>
              
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t("systemReports.pagination.page")} {page} {t("systemReports.pagination.of")} {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label={t("systemReports.pagination.next")}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
          {t("systemReports.noReportsFound")}
        </div>
      )}

      {/* Modal View */}
      {selectedReport && (
        <ReportDetailsModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}