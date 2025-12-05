import React, { useEffect, useState } from "react";
import { superAdminService } from "../../api/services/superAdminService";
import { useLoading } from "../../contexts/LoaderContext";
import { 
  CheckCircle, XCircle, Clock, Calendar, 
  FileText, User, Filter, AlertCircle,
  ChevronLeft, ChevronRight // ✅ استيراد أيقونات التنقل
} from "lucide-react";

export default function TimeOffRequests() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6; 

  const { show, hide } = useLoading();

  const fetchRequests = async () => {
    try {
      show();
      const res = await superAdminService.getLeaveRequests(statusFilter, page, limit);
      setRequests(res.data.data || []);
      
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleAction = async (requestId, newStatus) => {
    const note = prompt(
      newStatus === "approved" 
        ? "Add approval note (optional):" 
        : "Reason for rejection (optional):"
    );

    if (note === null) return;

    try {
      show();
      await superAdminService.updateLeaveStatus(requestId, newStatus, note);
      alert(`Request ${newStatus} successfully!`);
      fetchRequests(); 
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      hide();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Leave Requests</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review and manage time-off requests from Branch Admins.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {["pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                statusFilter === tab 
                  ? "bg-[#112D4E] text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-4">
        {requests.length > 0 ? (
          requests.map((req) => (
            <div key={req._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                
                {/* User Info */}
                <div className="flex gap-4 items-start min-w-[200px]">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                    {req.employee_id?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{req.employee_id?.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <User size={12} />
                      {req.employee_id?.branch_name || "Unknown Branch"}
                    </div>
                    <span className={`mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(req.status)} capitalize`}>
                      {req.status}
                    </span>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-slate-400 dark:text-slate-500 text-xs uppercase font-bold flex items-center gap-1">
                      <Calendar size={12} /> Duration
                    </span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {req.duration_days} Days {req.is_half_day ? "(Half Day)" : ""}
                    </p>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <span className="text-slate-400 dark:text-slate-500 text-xs uppercase font-bold flex items-center gap-1">
                      <FileText size={12} /> Reason & Type
                    </span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{req.leave_type}</p>
                    <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg mt-1 border border-slate-100 dark:border-slate-600 italic">
                      "{req.reason}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="flex lg:flex-col gap-2 justify-center min-w-[140px]">
                    <button 
                      onClick={() => handleAction(req._id, "approved")}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium shadow-sm active:scale-95"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button 
                      onClick={() => handleAction(req._id, "rejected")}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition font-medium active:scale-95"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                )}

                {/* Admin Note */}
                {req.status !== "pending" && req.admin_notes && (
                  <div className="lg:max-w-[200px] bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600 text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Admin Note:</span>
                    <p className="text-slate-700 dark:text-slate-300">{req.admin_notes}</p>
                  </div>
                )}

              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-3">
              <AlertCircle size={32} />
            </div>
            <p>No {statusFilter} requests found.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Page {page} of {totalPages}
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
    </div>
  );
}