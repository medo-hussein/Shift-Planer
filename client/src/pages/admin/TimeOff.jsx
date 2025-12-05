import React, { useEffect, useState } from "react";
import { leaveService } from "../../api/services/admin/leaveService";
import { useLoading } from "../../contexts/LoaderContext";
import { 
  Calendar, Clock, CheckCircle, XCircle, Plus, 
  User, FileText, AlertCircle, X, History, Inbox 
} from "lucide-react";

export default function TimeOff() {
  const [activeTab, setActiveTab] = useState("incoming"); // incoming | my_history
  
  // Data States
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "vacation", start_date: "", end_date: "", reason: ""
  });

  const { show, hide } = useLoading();

  // 1. Fetch Data based on active tab
  const fetchData = async () => {
    try {
      show();
      if (activeTab === "incoming") {
        const res = await leaveService.getEmployeeRequests(statusFilter);
        setEmployeeRequests(res.data.data || []);
      } else {
        const res = await leaveService.getMyRequests();
        setMyRequests(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  // 2. Actions
  const handleAction = async (id, status) => {
    const note = prompt(status === 'approved' ? "Approval Note:" : "Rejection Reason:");
    if (note === null) return;
    try {
      show();
      await leaveService.updateRequestStatus(id, status, note);
      fetchData();
    } catch (err) {
      alert("Action failed");
    } finally {
      hide();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      show();
      await leaveService.submitRequest(formData);
      alert("Request sent to Super Admin successfully.");
      setIsModalOpen(false);
      setFormData({ leave_type: "vacation", start_date: "", end_date: "", reason: "" });
      if (activeTab === "my_history") fetchData(); // Refresh if looking at history
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    } finally {
      hide();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Time Off Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage team leaves & track your own.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#112D4E] hover:bg-[#274b74] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition shadow-sm"
        >
          <Plus size={18} /> Request Leave
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`pb-2 px-1 flex items-center gap-2 text-sm font-medium transition ${
            activeTab === "incoming" 
              ? "border-b-2 border-[#112D4E] dark:border-blue-500 text-[#112D4E] dark:text-blue-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Inbox size={18} /> Employee Requests
        </button>
        <button
          onClick={() => setActiveTab("my_history")}
          className={`pb-2 px-1 flex items-center gap-2 text-sm font-medium transition ${
            activeTab === "my_history" 
              ? "border-b-2 border-[#112D4E] dark:border-blue-500 text-[#112D4E] dark:text-blue-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <History size={18} /> My Requests
        </button>
      </div>

      {/* --- Content: Incoming Requests (For Approval) --- */}
      {activeTab === "incoming" && (
        <>
          <div className="flex gap-2 mb-4">
            {["pending", "approved", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  statusFilter === status 
                    ? "bg-white text-blue-700 shadow-sm border border-blue-100 ring-1 ring-blue-200" 
                    : "text-slate-500 hover:bg-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {employeeRequests.length > 0 ? employeeRequests.map((req) => (
              <div key={req._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                      {req.employee_id?.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{req.employee_id?.name}</h3>
                      <span className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={12}/> {req.duration_days} Days</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">"{req.reason}"</p>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleAction(req._id, 'approved')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-medium transition">
                        <CheckCircle size={18} /> Approve
                      </button>
                      <button onClick={() => handleAction(req._id, 'rejected')} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition">
                        <XCircle size={18} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">No requests found.</div>
            )}
          </div>
        </>
      )}

      {/* --- Content: My History (Status View) --- */}
      {activeTab === "my_history" && (
        <div className="grid gap-4">
          {myRequests.length > 0 ? myRequests.map((req) => (
            <div key={req._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium capitalize">{req.leave_type} Leave</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {req.duration_days} Days</span>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600 italic">
                    My Reason: "{req.reason}"
                  </p>

                  {req.admin_notes && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold">Super Admin Note:</span> {req.admin_notes}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500">
                  Submitted on {new Date(req.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">You haven't submitted any requests yet.</div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn overflow-hidden dark:text-slate-100">
            <div className="bg-slate-50 dark:bg-slate-700 px-6 py-4 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Submit Leave Request</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Type</label>
                <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                  value={formData.leave_type} onChange={(e) => setFormData({...formData, leave_type: e.target.value})}>
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Start Date</label>
                  <input required type="date" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">End Date</label>
                  <input required type="date" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Reason</label>
                <textarea required rows="3" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-slate-700 dark:text-slate-100"
                  value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full py-3 bg-[#112D4E] dark:bg-[#1e3a5f] text-white rounded-xl hover:bg-[#274b74] dark:hover:bg-[#2d5080] font-bold transition shadow-md mt-2">Submit Request</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}