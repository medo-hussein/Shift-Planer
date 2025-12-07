import React, { useEffect, useState } from "react";
import { swapService } from "../../api/services/admin/swapService";
import { useLoading } from "../../contexts/LoaderContext";
import { Alert } from "../../utils/alertService"; 
import { 
  ArrowRightLeft, CheckCircle, XCircle, Calendar, AlertTriangle 
} from "lucide-react";
import Button from "../../utils/Button";
import { useTranslation } from "react-i18next";

export default function SwapApprovals() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");
  const { show, hide } = useLoading();
  const { t } = useTranslation();

  const fetchRequests = async () => {
    try {
      show();
      const res = await swapService.getBranchRequests();
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    if (action === "reject") {
        const confirmResult = await Alert.confirm(t("swapApprovals.confirmReject"));
        if (!confirmResult.isConfirmed) return;
    }

    // For approval, ask for optional note
    let adminNote = "";
    if (action === "approve") {
         const promptResult = await Alert.prompt({
            title: t("swapApprovals.approveTitle"),
            inputLabel: t("swapApprovals.addNoteLabel"),
            placeholder: t("swapApprovals.addNotePlaceholder"),
         });
         if (!promptResult.isConfirmed) return;
         adminNote = promptResult.value;
    }

    try {
      show();
      if (action === "approve") {
        await swapService.approveRequest(id, adminNote); 
        Alert.success(t("swapApprovals.approveSuccess"));
      } else {
        await swapService.rejectRequest(id);
        Alert.success(t("swapApprovals.rejectSuccess"));
      }
      fetchRequests();
    } catch (err) {
      Alert.error(err.response?.data?.message || t("swapApprovals.actionFailed"));
    } finally {
      hide();
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString();
  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const filteredRequests = requests.filter(r => {
      if (filter === 'pending') return r.status === 'accepted'; 
      if (filter === 'history') return ['approved', 'rejected'].includes(r.status);
      return false;
  });

  const getStatusInfo = (status) => {
    switch (status) {
      case 'accepted': return { 
        text: t('swapApprovals.status.needsApproval'), 
        bg: "bg-blue-100 dark:bg-blue-900/30", 
        textColor: "text-blue-800 dark:text-blue-400" 
      };
      case 'approved': return { 
        text: t('swapApprovals.status.approved'), 
        bg: "bg-green-100 dark:bg-green-900/30", 
        textColor: "text-green-800 dark:text-green-400" 
      };
      case 'rejected': return { 
        text: t('swapApprovals.status.rejected'), 
        bg: "bg-red-100 dark:bg-red-900/30", 
        textColor: "text-red-800 dark:text-red-400" 
      };
      default: return { 
        text: status, 
        bg: "bg-gray-100 dark:bg-gray-900/30", 
        textColor: "text-gray-800 dark:text-gray-400" 
      };
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t("swapApprovals.title")}
      </h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setFilter("pending")}
          className={`pb-2 px-4 font-medium transition-colors ${
            filter === "pending"
              ? "border-b-2 border-sky-600 text-sky-600"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
          }`}
        >
          {t("swapApprovals.pendingApproval")}
        </button>
        <button
          onClick={() => setFilter("history")}
          className={`pb-2 px-4 font-medium transition-colors ${
            filter === "history"
              ? "border-b-2 border-sky-600 text-sky-600"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400"
          }`}
        >
          {t("swapApprovals.history")}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                <ArrowRightLeft className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
                <p className="text-gray-500 dark:text-slate-400">
                  {t("swapApprovals.noRequestsFound")}
                </p>
            </div>
        ) : (
            filteredRequests.map((req) => {
              const statusInfo = getStatusInfo(req.status);
              return (
                <div key={req._id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        
                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${statusInfo.bg} ${statusInfo.textColor}`}>
                                    {statusInfo.text}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    {formatDate(req.createdAt)}
                                </span>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-slate-700 rounded-lg">
                                    <ArrowRightLeft className="text-blue-600 dark:text-blue-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        {req.requester_id?.name || t("swapApprovals.unknown")} 
                                        <span className="text-gray-400 mx-2 text-sm">⟷</span> 
                                        {req.target_employee_id?.name || t("swapApprovals.openShift")}
                                    </h3>
                                    
                                    <div className="text-sm text-gray-600 dark:text-slate-300 mt-1 space-y-1">
                                        {/* ✅ FIX: Check if shift_id exists before accessing properties */}
                                        {req.shift_id ? (
                                            <p className="flex items-center gap-1 font-medium">
                                                <Calendar size={14} className="text-gray-400"/> 
                                                {t("swapApprovals.shift")}: {formatDate(req.shift_id.start_date_time)} 
                                                <span className="text-gray-400 px-1">|</span>
                                                {formatTime(req.shift_id.start_date_time)} - {formatTime(req.shift_id.end_date_time)}
                                            </p>
                                        ) : (
                                            <p className="flex items-center gap-1 font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit">
                                                <AlertTriangle size={14} /> 
                                                {t("swapApprovals.shiftDeleted")}
                                            </p>
                                        )}
                                        
                                        {req.reason && <p className="italic text-gray-500 bg-gray-50 dark:bg-slate-700/50 p-1 px-2 rounded inline-block mt-1">"{req.reason}"</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {req.status === 'accepted' && (
                            <div className="flex gap-2 items-center justify-end">
                                {/* Only show approve if shift exists */}
                                {req.shift_id && (
                                    <Button 
                                        onClick={() => handleAction(req._id, "approve")}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} /> {t("swapApprovals.approveButton")}
                                    </Button>
                                )}
                                <Button 
                                    onClick={() => handleAction(req._id, "reject")}
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    <XCircle size={18} /> {t("swapApprovals.rejectButton")}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}