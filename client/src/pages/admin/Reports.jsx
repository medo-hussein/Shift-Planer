import React, { useEffect, useState } from "react";
import { reportService } from "../../api/services/admin/reportService";
import { useLoading } from "../../contexts/LoaderContext";
import apiClient from "../../api/apiClient";
import { 
  FileText, Calendar, Plus, Trash2, Eye, 
  BarChart2, Clock, Filter, X, ChevronLeft, ChevronRight, Building
} from "lucide-react";

// تأكد إن المسار ده صحيح، أو انسخ ملف المودال لمكان مشترك
import ReportDetailsModal from "../superadmin/ReportDetailsModal"; 

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  
  // ✅ Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6; // عدد التقارير في الصفحة الواحدة

  const { show, hide } = useLoading();

  const fetchData = async () => {
    try {
      show();
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
      hide();
    }
  };

  // إعادة الجلب عند تغيير الصفحة أو الفلتر
  useEffect(() => {
    fetchData();
  }, [page, filterType]);

  // تصفير الصفحة عند تغيير الفلتر
  useEffect(() => {
    setPage(1);
  }, [filterType]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      show();
      await reportService.delete(id);
      fetchData(); 
    } catch (err) {
      alert("Failed to delete report");
    } finally {
      hide();
    }
  };

  // دالة لعرض ألوان مختلفة حسب نوع التقرير
  const getReportStyle = (type) => {
    switch (type) {
      case 'attendance': return { icon: Clock, bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'performance': return { icon: BarChart2, bg: 'bg-purple-50', text: 'text-purple-600' };
      case 'shift': return { icon: Calendar, bg: 'bg-orange-50', text: 'text-orange-600' };
      default: return { icon: FileText, bg: 'bg-slate-50', text: 'text-slate-600' };
    }
  };

  // دالة لعرض إحصائيات سريعة على الكارت
  const renderQuickStats = (report) => {
    const data = report.data || {};
    if (report.type === 'attendance') {
      return (
        <div className="flex justify-between text-center mt-4 pt-4 border-t border-slate-50">
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">Rate</p><p className="text-sm font-bold text-blue-600">{data.attendance_rate || 0}%</p></div>
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">Present</p><p className="text-sm font-bold text-emerald-600">{data.summary?.present || 0}</p></div>
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">Late</p><p className="text-sm font-bold text-amber-500">{data.summary?.late || 0}</p></div>
        </div>
      );
    }
    if (report.type === 'performance') {
      return (
        <div className="flex justify-between text-center mt-4 pt-4 border-t border-slate-50">
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">Avg Score</p><p className="text-sm font-bold text-purple-600">{data.averages?.avg_performance || 0}%</p></div>
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">Employees</p><p className="text-sm font-bold text-slate-700">{data.employees?.length || 0}</p></div>
        </div>
      );
    }
    if (report.type === 'shift') {
      return (
        <div className="flex justify-between text-center mt-4 pt-4 border-t border-slate-50">
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">Total</p><p className="text-sm font-bold text-orange-600">{data.total_shifts || 0}</p></div>
          <div><p className="text-[10px] text-slate-400 uppercase font-bold">Completed</p><p className="text-sm font-bold text-blue-600">{data.by_status?.completed || 0}</p></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Generate, view, and analyze your branch reports.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <select 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3F72AF] cursor-pointer shadow-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Reports</option>
              <option value="attendance">Attendance</option>
              <option value="shift">Shift</option>
              <option value="performance">Performance</option>
            </select>
          </div>
          <button 
            onClick={() => setIsGenerateModalOpen(true)}
            className="bg-[#112D4E] hover:bg-[#274b74] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition shadow-sm active:scale-95"
          >
            <Plus size={16} /> Generate
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      {reports.length > 0 ? (
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
                    <button onClick={() => setSelectedReport(report)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Eye size={16}/></button>
                    <button onClick={() => handleDelete(report.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 mb-1 line-clamp-1" title={report.title}>{report.title}</h3>
                
                <div className="text-xs text-slate-500 flex items-center gap-2 mb-auto">
                  <Calendar size={12} />
                  {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
                </div>

                {renderQuickStats(report)}

                <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                   <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                   <span className="capitalize bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{report.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
          <div className="p-4 bg-slate-50 rounded-full mb-4"><FileText size={32} className="text-slate-300" /></div>
          <h3 className="text-lg font-bold text-slate-700">No Reports Found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">Generate a new report to analyze attendance, shifts, or employee performance.</p>
          <button 
            onClick={() => setIsGenerateModalOpen(true)}
            className="mt-6 px-5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            Generate First Report
          </button>
        </div>
      )}

      {/* ✅ Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10 pb-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-sm font-semibold text-slate-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <GenerateReportModal 
          onClose={() => setIsGenerateModalOpen(false)} 
          onSuccess={() => {
            setIsGenerateModalOpen(false);
            setPage(1); // ارجع للصفحة الأولى عشان تشوف الجديد
            fetchData();
          }}
          loadingUtils={{ show, hide }}
        />
      )}

      {/* View Details Modal */}
      {selectedReport && (
        <ReportDetailsModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
}

// --- Generate Modal Component ---
function GenerateReportModal({ onClose, onSuccess, loadingUtils }) {
  const [type, setType] = useState("attendance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const loadEmps = async () => {
      try {
        const res = await apiClient.get("/api/admin/employees");
        setEmployees(res.data.data || []);
      } catch(err) { console.error(err); }
    };
    loadEmps();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingUtils.show();
    try {
      const payload = { 
        start_date: startDate, 
        end_date: endDate, 
        employee_id: employeeId || null 
      };

      if (type === "attendance") await reportService.generateAttendance(payload);
      else if (type === "shift") await reportService.generateShift(payload);
      else if (type === "performance") await reportService.generatePerformance(payload);

      alert("Report generated successfully!");
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || "Generation failed");
    } finally {
      loadingUtils.hide();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn overflow-hidden scale-100">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Generate Report</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition"><X size={20} className="text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Report Type</label>
            <div className="relative">
              <select 
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white appearance-none"
                value={type} onChange={(e) => setType(e.target.value)}
              >
                <option value="attendance">Attendance Report</option>
                <option value="shift">Shift Report</option>
                <option value="performance">Performance Report</option>
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Start Date</label>
              <input required type="date" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF]"
                value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">End Date</label>
              <input required type="date" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF]"
                value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Specific Employee (Optional)</label>
            <div className="relative">
              <select 
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white appearance-none"
                value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full py-3 bg-[#112D4E] text-white rounded-xl hover:bg-[#274b74] font-bold transition shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2">
               <FileText size={18} /> Generate Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}