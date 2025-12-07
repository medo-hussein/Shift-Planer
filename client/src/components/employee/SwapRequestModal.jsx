import React, { useState, useEffect } from "react";
import { X, Send, Users, AlertCircle, UserPlus, ArrowRightLeft, Calendar } from "lucide-react";
import Button from "../../utils/Button";
import { employeeService } from "../../api/services/employeeService";
import { useLoading } from "../../contexts/LoaderContext";
import { Alert } from "../../utils/alertService";

const SwapRequestModal = ({ shift, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [swapType, setSwapType] = useState("open"); // 'open' or 'direct'
  
  // Data States
  const [colleagues, setColleagues] = useState([]);
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  
  // ✅ New: Target Shift Selection (Exchange)
  const [targetShifts, setTargetShifts] = useState([]);
  const [targetShiftId, setTargetShiftId] = useState(""); 
  
  const { show, hide } = useLoading();

  // 1. Fetch Colleagues when 'Specific' is selected
  useEffect(() => {
    if (swapType === 'direct' && colleagues.length === 0) {
        const fetchColleagues = async () => {
            try {
                const res = await employeeService.getColleagues();
                setColleagues(res.data.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchColleagues();
    }
  }, [swapType]);

  // 2. ✅ Fetch Target Shifts when a Colleague is selected
  useEffect(() => {
    if (targetEmployeeId) {
        const fetchShifts = async () => {
            try {
                show();
                const res = await employeeService.getColleagueShifts(targetEmployeeId);
                setTargetShifts(res.data.data || []);
                setTargetShiftId(""); // Reset selection
            } catch (err) {
                console.error(err);
            } finally {
                hide();
            }
        };
        fetchShifts();
    } else {
        setTargetShifts([]);
        setTargetShiftId("");
    }
  }, [targetEmployeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return Alert.warning("Please provide a reason.");
    if (swapType === 'direct' && !targetEmployeeId) return Alert.warning("Please select a colleague.");

    try {
      show();
      await employeeService.createSwapRequest({
        shift_id: shift._id,
        reason: reason,
        target_employee_id: swapType === 'direct' ? targetEmployeeId : null,
        target_shift_id: targetShiftId || null // ✅ Send target shift if selected
      });
      
      Alert.success(targetShiftId ? "Exchange request sent!" : "Swap request sent!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Alert.error(err.response?.data?.message || "Failed to send request");
    } finally {
      hide();
    }
  };

  const formatShiftTime = (isoString) => {
      return new Date(isoString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-100 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-[#112D4E] p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-sky-400" />
            <h3 className="font-bold text-lg">Request Shift Swap</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition"><X size={20} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Shift Info */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600 text-sm">
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">My Shift (To Give):</p>
            <p className="text-slate-600 dark:text-slate-300">
              {new Date(shift.start_date_time).toLocaleDateString()} • {formatShiftTime(shift.start_date_time)} - {formatShiftTime(shift.end_date_time)}
            </p>
          </div>

          {/* Swap Type Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
            <button
                type="button"
                onClick={() => setSwapType('open')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    swapType === 'open' 
                    ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
            >
                Any Colleague
            </button>
            <button
                type="button"
                onClick={() => setSwapType('direct')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    swapType === 'direct' 
                    ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
            >
                Specific Person
            </button>
          </div>

          {/* Logic */}
          {swapType === 'open' ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-start border border-blue-100 dark:border-blue-800">
                <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Post this shift to the board. Any eligible colleague can offer to take it.
                </p>
              </div>
          ) : (
              <div className="space-y-4">
                {/* Select Colleague */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Select Colleague</label>
                    <div className="relative">
                        <UserPlus className="absolute left-3 top-3 text-slate-400" size={18}/>
                        <select 
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700"
                            value={targetEmployeeId}
                            onChange={(e) => setTargetEmployeeId(e.target.value)}
                            required={swapType === 'direct'}
                        >
                            <option value="">Choose a colleague...</option>
                            {colleagues.map(colleague => (
                                <option key={colleague._id} value={colleague._id}>
                                    {colleague.name} ({colleague.position || 'Employee'})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Select Shift to Take (Optional) */}
                {targetEmployeeId && (
                    <div className="animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                            Shift to Take in Return (Optional)
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-slate-400" size={18}/>
                            <select 
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700"
                                value={targetShiftId}
                                onChange={(e) => setTargetShiftId(e.target.value)}
                            >
                                <option value="">None (Give away only)</option>
                                {targetShifts.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {new Date(s.start_date_time).toLocaleDateString()} ({formatShiftTime(s.start_date_time)} - {formatShiftTime(s.end_date_time)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {targetShiftId && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <ArrowRightLeft size={12}/> You will exchange shifts.
                            </p>
                        )}
                    </div>
                )}
              </div>
          )}

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea 
              required 
              rows={2}
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#3F72AF] bg-white dark:bg-slate-700 resize-none"
              placeholder="e.g. Personal matter..."
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" className="flex-[2] flex items-center justify-center gap-2" type="submit">
              <Send size={18} /> {targetShiftId ? "Propose Exchange" : "Send Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SwapRequestModal;