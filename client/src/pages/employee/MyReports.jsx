import React, { useEffect, useState } from "react";
import { employeeService } from "../../api/services/employeeService";
import { useLoading } from "../../contexts/LoaderContext";
import { FileText, Calendar, Eye, Clock } from "lucide-react";
import ReportDetailsModal from "../superadmin/ReportDetailsModal"; // Reuse Modal

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const { show, hide } = useLoading();

  useEffect(() => {
    const fetch = async () => {
      try {
        show();
        const res = await employeeService.getMyReports();
        setReports(res.data.data || []); 
      } catch (err) { 
        console.error(err); 
      } finally { 
        hide(); 
      }
    };
    fetch();
  }, []);

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">My Performance Reports</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.length > 0 ? reports.map(report => (
          <div key={report._id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                {report.type === 'attendance' ? <Clock size={20}/> : <FileText size={20}/>}
              </div>
              <button onClick={() => setSelectedReport(report)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline dark:hover:text-blue-300 flex items-center gap-1">
                <Eye size={14}/> View
              </button>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{report.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar size={12}/> {new Date(report.createdAt || report.created_at).toLocaleDateString()}
            </p>
          </div>
        )) : (
          <div className="col-span-full text-center py-10 text-slate-400 dark:text-slate-500">No reports shared with you yet.</div>
        )}
      </div>

      {selectedReport && <ReportDetailsModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
    </div>
  );
}