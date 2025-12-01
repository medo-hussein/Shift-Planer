import React, { useEffect, useState } from "react";
import { superAdminService } from "../../api/services/superAdminService";
import { useLoading } from "../../contexts/LoaderContext";
import { FileText, Calendar, Filter, User, Building, Eye, BarChart2, Clock, CheckCircle } from "lucide-react";

// هنضيف المودال ده في نفس الملف تحت أو في ملف منفصل
import ReportDetailsModal from "./ReportDetailsModal"; 

export default function SystemReports() {
  const [reports, setReports] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [selectedReport, setSelectedReport] = useState(null); // للتقرير المختار
  const { show, hide } = useLoading();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        show();
        const params = filterType ? { type: filterType } : {};
        const res = await superAdminService.getSystemReports(params);
        setReports(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        hide();
      }
    };
    fetchReports();
  }, [filterType]);

  const getStatusColor = (type) => {
    switch (type) {
      case 'attendance': return 'text-blue-600 bg-blue-50';
      case 'performance': return 'text-purple-600 bg-purple-50';
      case 'shift': return 'text-orange-600 bg-orange-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  // دالة صغيرة لاستخراج أهم معلومة من كل تقرير لعرضها في الكارت
  const renderQuickStats = (report) => {
    const data = report.data || {};
    
    if (report.type === 'attendance') {
      return (
        <div className="flex gap-4 mt-3 mb-2">
          <div className="text-center">
            <p className="text-xs text-slate-400">Attendance</p>
            <p className="text-sm font-bold text-blue-600">{data.attendance_rate || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Present</p>
            <p className="text-sm font-bold text-emerald-600">{data.summary?.present || data.present_count || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Late</p>
            <p className="text-sm font-bold text-amber-500">{data.summary?.late || data.late_count || 0}</p>
          </div>
        </div>
      );
    }

    if (report.type === 'shift') {
      return (
        <div className="flex gap-4 mt-3 mb-2">
          <div className="text-center">
            <p className="text-xs text-slate-400">Total Shifts</p>
            <p className="text-sm font-bold text-orange-600">{data.total_shifts || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Completed</p>
            <p className="text-sm font-bold text-blue-600">{data.by_status?.completed || 0}</p>
          </div>
        </div>
      );
    }

    if (report.type === 'performance') {
      return (
        <div className="flex gap-4 mt-3 mb-2">
          <div className="text-center">
            <p className="text-xs text-slate-400">Avg Score</p>
            <p className="text-sm font-bold text-purple-600">{data.averages?.avg_performance || 0}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Reports</h1>
          <p className="text-slate-500 text-sm">Detailed analytics from all branches.</p>
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <select 
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3F72AF] cursor-pointer bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Report Types</option>
            <option value="attendance">Attendance</option>
            <option value="performance">Performance</option>
            <option value="shift">Shift Analysis</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col h-full">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 rounded-lg ${getStatusColor(report.type)}`}>
                {report.type === 'attendance' ? <Clock size={20} /> : 
                 report.type === 'performance' ? <BarChart2 size={20} /> : 
                 <Calendar size={20} />}
              </div>
              <button 
                onClick={() => setSelectedReport(report)}
                className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1"
              >
                <Eye size={14} /> View Details
              </button>
            </div>

            {/* Content */}
            <h3 className="font-bold text-slate-800 mb-1 line-clamp-1" title={report.title}>{report.title}</h3>
            <p className="text-xs text-slate-500 mb-2">
              Generated on {new Date(report.createdAt).toLocaleDateString()}
            </p>

            {/* Quick Stats (The new part) */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              {renderQuickStats(report)}
            </div>

            {/* Footer Info */}
            <div className="mt-auto pt-4 border-t border-slate-50 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Building size={14} className="text-slate-400" />
                <span className="truncate text-xs">{report.generated_by_admin_id?.branch_name || "Unknown Branch"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-xs">
                  {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal View */}
      {selectedReport && (
        <ReportDetailsModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}