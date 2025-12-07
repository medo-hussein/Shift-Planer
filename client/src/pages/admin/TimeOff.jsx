import { useEffect, useState } from "react";
import { leaveService } from "../../api/services/admin/leaveService";
import { useLoading } from "../../contexts/LoaderContext";
import { 
  Calendar, Clock, CheckCircle, XCircle, Plus, X, History, Inbox 
} from "lucide-react";
import {Alert} from "../../utils/alertService.js";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  // Fetch Data based on active tab
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
    const { value: note, isConfirmed } = await Alert.prompt({
      title: status === 'approved' ? t("timeOff.approvalNote") : t("timeOff.rejectionReason"),
      inputLabel: t("timeOff.enterNote"),
      placeholder: t("timeOff.typeHere"),
      required: true
    });
    if (!isConfirmed) return;
    if (note === null) return;

    try {
      show();
      await leaveService.updateRequestStatus(id, status, note);
      fetchData();
      Alert.success(t("timeOff.requestStatusSuccess", { status: t(`timeOff.status.${status}`) }));
    } catch (err) {
      Alert.error(t("timeOff.actionFailed"));
    } finally {
      hide();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      show();
      await leaveService.submitRequest(formData);
      Alert.success(t("timeOff.requestSentSuccess"));
      setIsModalOpen(false);
      setFormData({ leave_type: "vacation", start_date: "", end_date: "", reason: "" });
      if (activeTab === "my_history") fetchData(); // Refresh if looking at history
    } catch (err) {
      Alert.error(err.response?.data?.message || t("timeOff.submitFailed"));
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

  const getLeaveTypeTranslation = (type) => {
    return t(`timeOff.leaveTypes.${type}`);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("timeOff.title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {t("timeOff.subtitle")}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#112D4E] hover:bg-[#274b74] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition shadow-sm"
        >
          <Plus size={18} /> {t("timeOff.requestLeave")}
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
          <Inbox size={18} /> {t("timeOff.employeeRequests")}
        </button>
        <button
          onClick={() => setActiveTab("my_history")}
          className={`pb-2 px-1 flex items-center gap-2 text-sm font-medium transition ${
            activeTab === "my_history" 
              ? "border-b-2 border-[#112D4E] dark:border-blue-500 text-[#112D4E] dark:text-blue-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <History size={18} /> {t("timeOff.myRequests")}
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
                {t(`timeOff.status.${status}`)}
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
                        {t(`timeOff.status.${req.status}`)}
                      </span>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={12}/> {req.duration_days} {t("timeOff.days")}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">"{req.reason}"</p>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleAction(req._id, 'approved')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-medium transition">
                        <CheckCircle size={18} /> {t("timeOff.approve")}
                      </button>
                      <button onClick={() => handleAction(req._id, 'rejected')} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition">
                        <XCircle size={18} /> {t("timeOff.reject")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                {t("timeOff.noRequestsFound")}
              </div>
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
                      {t(`timeOff.status.${req.status}`)}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium capitalize">
                      {getLeaveTypeTranslation(req.leave_type)} {t("timeOff.leave")}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {req.duration_days} {t("timeOff.days")}</span>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600 italic">
                    {t("timeOff.myReason")}: "{req.reason}"
                  </p>

                  {req.admin_notes && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold">{t("timeOff.superAdminNote")}:</span> {req.admin_notes}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {t("timeOff.submittedOn")} {new Date(req.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              {t("timeOff.noSubmissions")}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn overflow-hidden dark:text-slate-100">
            <div className="bg-slate-50 dark:bg-slate-700 px-6 py-4 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {t("timeOff.submitLeaveRequest")}
              </h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t("timeOff.type")}
                </label>
                <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                  value={formData.leave_type} onChange={(e) => setFormData({...formData, leave_type: e.target.value})}>
                  <option value="vacation">{t("timeOff.leaveTypes.vacation")}</option>
                  <option value="sick">{t("timeOff.leaveTypes.sick")}</option>
                  <option value="personal">{t("timeOff.leaveTypes.personal")}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {t("timeOff.startDate")}
                  </label>
                  <input required type="date" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {t("timeOff.endDate")}
                  </label>
                  <input required type="date" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t("timeOff.reason")}
                </label>
                <textarea required rows="3" className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-slate-700 dark:text-slate-100"
                  value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full py-3 bg-[#112D4E] dark:bg-[#1e3a5f] text-white rounded-xl hover:bg-[#274b74] dark:hover:bg-[#2d5080] font-bold transition shadow-md mt-2">
                {t("timeOff.submitRequestButton")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}