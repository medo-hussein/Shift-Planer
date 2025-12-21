import { useEffect, useState } from "react";
import { reportService } from "../../api/services/admin/reportService";
import { useLoading } from "../../contexts/LoaderContext";
import apiClient from "../../api/apiClient";
import { 
  FileText, Calendar, Plus, Trash2, Eye, Share2, 
  Clock, Filter, X, ChevronLeft, ChevronRight, Check
} from "lucide-react";
import {Alert} from "../../utils/alertService.js";
import ReportDetailsModal from "../superadmin/ReportDetailsModal"; 
import { useTranslation } from "react-i18next";
import DashboardSkeleton from "../../utils/DashboardSkeleton.jsx";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [reportToShare, setReportToShare] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6; 
  const [loading, setLoading] = useState(true);
  

  const { show, hide } = useLoading();
  const { t } = useTranslation();

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { 
        page, 
        limit, 
        ...(filterType && { type: filterType }) 
      };

      const res = await reportService.getAll(params);
      setReports(res.data.data.reports || []);
      
      if (res.data.data.pagination) {
        setTotalPages(res.data.data.pagination.total_pages);
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterType]);

  useEffect(() => {
    setPage(1);
  }, [filterType]);

  const handleDelete = async (id) => {
    const confirmResult = await Alert.confirm(t("reports.confirmDelete"));
    if(!confirmResult.isConfirmed) return;

    try {
      setLoading(true);
      await reportService.delete(id);
      fetchData();
      Alert.success(t("reports.deleteSuccess")); 
    } catch (err) {
      Alert.error(t("reports.deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  const getReportStyle = (type) => {
    switch (type) {
      case 'attendance': return { icon: Clock, bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'shift': return { icon: Calendar, bg: 'bg-orange-50', text: 'text-orange-600' };
      default: return { icon: FileText, bg: 'bg-slate-50', text: 'text-slate-600' };
    }
  };

  const renderQuickStats = (report) => {
    const data = report.data || {};
    
    if (report.type === 'attendance') {
      return (
        <div className="flex justify-between text-center mt-4 pt-4 border-t border-slate-50">
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">{t("reports.stats.rate")}</p><p className="text-sm font-bold text-blue-600">{data.attendance_rate || 0}%</p></div>
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">{t("reports.stats.present")}</p><p className="text-sm font-bold text-emerald-600">{data.summary?.present || 0}</p></div>
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">{t("reports.stats.late")}</p><p className="text-sm font-bold text-amber-500">{data.summary?.late || 0}</p></div>
        </div>
      );
    }

    if (report.type === 'shift') {
      return (
        <div className="flex justify-between text-center mt-4 pt-4 border-t border-slate-50">
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">{t("reports.stats.total")}</p><p className="text-sm font-bold text-orange-600">{data.total_shifts || 0}</p></div>
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">{t("reports.stats.completed")}</p><p className="text-sm font-bold text-blue-600">{data.by_status?.completed || 0}</p></div>
        </div>
      );
    }

    return null;
  };
  if(loading) return <DashboardSkeleton />;
  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen font-sans dark:text-slate-100">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("reports.title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {t("reports.subtitle")}
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
            <select 
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3F72AF] cursor-pointer shadow-sm dark:text-slate-100"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">{t("reports.filters.all")}</option>
              <option value="attendance">{t("reports.filters.attendance")}</option>
              <option value="shift">{t("reports.filters.shift")}</option>
            </select>
          </div>
          <button 
            onClick={() => setIsGenerateModalOpen(true)}
            className="bg-[#112D4E] hover:bg-[#274b74] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition shadow-sm active:scale-95"
          >
            <Plus size={16} /> {t("reports.generate")}
          </button>
        </div>
      </div>

      {reports.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report) => {
              const style = getReportStyle(report.type);
              const Icon = style.icon;
              
              return (
                <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 flex flex-col h-full group">
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2.5 rounded-xl ${style.bg} ${style.text}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelectedReport(report)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600" title={t("reports.actions.view")}>
                          <Eye size={16}/>
                      </button>
                      <button onClick={() => setReportToShare(report)} className="p-1.5 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600" title={t("reports.actions.share")}>
                          <Share2 size={16}/>
                      </button>
                      <button onClick={() => handleDelete(report.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600" title={t("reports.actions.delete")}>
                          <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 mb-1 line-clamp-1" title={report.title}>{report.title}</h3>
                  
                  <div className="text-xs text-slate-500 flex items-center gap-2 mb-auto">
                    <Calendar size={12} />
                    {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
                  </div>

                  {renderQuickStats(report)}
                  
                  <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                     <span>{t("reports.created")}: {new Date(report.created_at).toLocaleDateString()}</span>
                     <span className="capitalize bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {t(`reports.types.${report.type}`)}
                     </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pb-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={20} />
              </button>
              
              <span className="text-sm font-medium text-slate-600">
                {t("reports.pageOf", { page, totalPages })}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
          {t("reports.noReports")}
        </div>
      )}

      {/* Modal View */}
      {selectedReport && (
        <ReportDetailsModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      {reportToShare && (
        <ShareReportModal 
            report={reportToShare} 
            onClose={() => setReportToShare(null)} 
            loadingUtils={{ show, hide }}
        />
      )}

      {isGenerateModalOpen && (
        <GenerateReportModal 
          onClose={() => setIsGenerateModalOpen(false)} 
          onSuccess={() => { setIsGenerateModalOpen(false); setPage(1); fetchData(); }}
          loadingUtils={{ show, hide }}
        />
      )}

    </div>
  );
}

// --- Generate Report Modal (Updated: Removed Performance) ---
function GenerateReportModal({ onClose, onSuccess, loadingUtils }) {
    const [type, setType] = useState("attendance");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [employees, setEmployees] = useState([]);
    const { t } = useTranslation();

    useEffect(() => {
        apiClient.get("/api/admin/employees").then(res => setEmployees(res.data.data || []));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        loadingUtils.show();
        try {
            const payload = { start_date: startDate, end_date: endDate, employee_id: employeeId || null };
            if (type === "attendance") await reportService.generateAttendance(payload);
            else if (type === "shift") await reportService.generateShift(payload);            
            Alert.success(t("reports.generateSuccess"));
            onSuccess();
        } catch (err) { Alert.error(err.response?.data?.message || t("reports.generateFailed")); } 
        finally { loadingUtils.hide(); }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 dark:text-slate-100">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold dark:text-slate-100">{t("reports.generateModal.title")}</h3>
                  <button onClick={onClose}><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select 
                      className="w-full border p-2 rounded dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      value={type} 
                      onChange={e => setType(e.target.value)}
                    >
                        <option value="attendance">{t("reports.types.attendance")}</option>
                        <option value="shift">{t("reports.types.shift")}</option>
                        {/* Performance removed */}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="date" 
                          required 
                          className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 p-2 rounded" 
                          value={startDate} 
                          onChange={e => setStartDate(e.target.value)} 
                          placeholder={t("reports.generateModal.startDate")}
                        />
                        <input 
                          type="date" 
                          required 
                          className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 p-2 rounded" 
                          value={endDate} 
                          onChange={e => setEndDate(e.target.value)}
                          placeholder={t("reports.generateModal.endDate")}
                        />
                    </div>
                    <select 
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 p-2 rounded" 
                      value={employeeId} 
                      onChange={e => setEmployeeId(e.target.value)}
                    >
                        <option value="">{t("reports.generateModal.allEmployees")}</option>
                        {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                    <button 
                      type="submit" 
                      className="w-full bg-blue-900 dark:bg-blue-700 text-white p-2 rounded hover:bg-blue-800 dark:hover:bg-blue-600"
                    >
                      {t("reports.generateModal.generateButton")}
                    </button>
                </form>
            </div>
        </div>
    );
}

function ShareReportModal({ report, onClose, loadingUtils }) {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const { t } = useTranslation();
    
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await apiClient.get("/api/admin/employees");
                setEmployees(res.data.data || []);
                setSelectedEmployees(report.shared_with_users || []);
            } catch (err) { console.error(err); }
        };
        loadData();
    }, [report]);

    const toggleEmployee = (id) => {
        if (selectedEmployees.includes(id)) {
            setSelectedEmployees(prev => prev.filter(e => e !== id));
        } else {
            setSelectedEmployees(prev => [...prev, id]);
        }
    };

    const handleShare = async () => {
        if (selectedEmployees.length === 0) return;

        loadingUtils.show();
        try {
            await reportService.share(report.id, selectedEmployees);
            Alert.success(t("reports.shareSuccess"));
            onClose();
        } catch (err) {
            Alert.error(err.response?.data?.message || t("reports.shareFailed"));
        } finally {
            loadingUtils.hide();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] dark:text-slate-100">
                <div className="bg-slate-50 dark:bg-slate-700 px-6 py-4 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">
                          {t("reports.shareModal.title")}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{report.title}</p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"/></button>
                </div>

                <div className="p-4 overflow-y-auto">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      {t("reports.shareModal.selectEmployees")}
                    </p>
                    <div className="space-y-2">
                        {employees.map(emp => (
                            <div 
                                key={emp._id} 
                                onClick={() => toggleEmployee(emp._id)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                    selectedEmployees.includes(emp._id) 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600' 
                                    : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedEmployees.includes(emp._id) ? 'bg-blue-200 dark:bg-blue-600 text-blue-700 dark:text-blue-200' : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{emp.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{emp.position || t("reports.shareModal.defaultPosition")}</p>
                                    </div>
                                </div>
                                {selectedEmployees.includes(emp._id) && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                            </div>
                        ))}
                        {employees.length === 0 && <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">{t("reports.shareModal.noEmployees")}</p>}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                    <button 
                        onClick={handleShare} 
                        disabled={selectedEmployees.length === 0}
                        className={`w-full py-2.5 rounded-xl font-medium transition shadow-md flex justify-center items-center gap-2 ${
                            selectedEmployees.length === 0 
                            ? "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                            : "bg-[#112D4E] dark:bg-[#1e3a5f] text-white hover:bg-[#274b74] dark:hover:bg-[#2d5080]"
                        }`}
                    >
                        <Share2 size={16} /> {t("reports.shareModal.shareButton", { count: selectedEmployees.length })}
                    </button>
                </div>
            </div>
        </div>
    );
}