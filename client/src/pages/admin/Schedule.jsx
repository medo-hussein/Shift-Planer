import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLoading } from "../../contexts/LoaderContext";
import shiftService from "../../api/services/admin/shiftService";
import apiClient from "../../api/apiClient";
import { 
  Plus, X, Clock, MapPin, FileText, Trash2, Save, 
  AlertCircle, Lock, CheckSquare, Square, Info, 
  Sparkles, Loader2, RotateCcw, Mic, MicOff, Languages
} from "lucide-react";
import { Alert } from "../../utils/alertService.js";
import Button from "../../utils/Button"; 
import { useTranslation } from "react-i18next";

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const { show, hide } = useLoading();
  const { t } = useTranslation();
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // AI Modal States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiCommand, setAiCommand] = useState("");
  const [aiPreview, setAiPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // ✅ Voice Input State (With Language Toggle)
  const [isListening, setIsListening] = useState(false);
  const [micLang, setMicLang] = useState('ar-EG'); 
  const recognitionRef = useRef(null);

  const [formData, setFormData] = useState({
    employee_ids: [], 
    title: "",
    start_date_time: "",
    end_date_time: "",
    shift_type: "regular",
    location: "",
    notes: ""
  });

  // Fetch Shifts & Employees
  const fetchData = async () => {
    try {
      show();
      const [shiftsRes, employeesRes] = await Promise.all([
        shiftService.getBranchShifts({ limit: 1000 }), 
        apiClient.get("/api/admin/employees")
      ]);
      const shifts = shiftsRes.data.data || [];
      const emps = employeesRes.data.data || [];
      setEvents(shifts.map(mapShiftToEvent));
      setEmployees(emps);
    } catch (err) {
      console.error("Failed to load schedule data", err);
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchData();
    
    // Cleanup recognition on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const mapShiftToEvent = (s) => {
    const now = new Date();
    const start = new Date(s.start_date_time);
    const end = new Date(s.end_date_time);
    const isPast = end < now;

    let color = getShiftColor(s.shift_type); 
    let borderColor = color;

    if (s.status === 'completed') {
      color = '#9ca3af'; 
      borderColor = '#d1d5db';
    } else if (s.status === 'in_progress') {
      color = '#10b981'; 
      borderColor = '#059669';
    } else if (isPast && s.status === 'scheduled') {
      color = '#ef4444'; 
      borderColor = '#b91c1c';
    }

    return {
      id: s._id,
      title: `${s.employee_id?.name || t("schedule.unknown")} - ${s.title}`,
      start: start, 
      end: end,
      backgroundColor: color,
      borderColor: borderColor,
      allDay: false,
      extendedProps: { 
        employeeId: s.employee_id?._id,
        rawTitle: s.title,
        type: s.shift_type,
        location: s.location,
        notes: s.notes,
        status: s.status,
        isPast: isPast
      },
    };
  };

  const getShiftColor = (type) => {
    switch (type) {
      case "regular": return "#3b82f6"; 
      case "overtime": return "#f59e0b"; 
      case "holiday": return "#8b5cf6"; 
      case "weekend": return "#ec4899"; 
      case "emergency": return "#ef4444"; 
      default: return "#6b7280";
    }
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleEventClick = (info) => {
    const event = info.event;
    const props = event.extendedProps;
    const readOnly = props.status === 'completed';
    setIsReadOnly(readOnly);

    setFormData({
      employee_ids: [props.employeeId],
      title: props.rawTitle,
      start_date_time: formatDateForInput(event.start),
      end_date_time: formatDateForInput(event.end),
      shift_type: props.type,
      location: props.location || "",
      notes: props.notes || ""
    });

    setSelectedShiftId(event.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShiftId(null);
    setIsReadOnly(false); 
    setFormData({
      employee_ids: [], 
      title: "", 
      start_date_time: "", 
      end_date_time: "", 
      shift_type: "regular", 
      location: "", 
      notes: "" 
    });
  };

  const toggleEmployee = (empId) => {
    if (isReadOnly) return;
    setFormData(prev => {
        const currentIds = prev.employee_ids;
        if (selectedShiftId) {
            return { ...prev, employee_ids: [empId] }; 
        }
        if (currentIds.includes(empId)) {
            return { ...prev, employee_ids: currentIds.filter(id => id !== empId) };
        } else {
            return { ...prev, employee_ids: [...currentIds, empId] };
        }
    });
  };

  const toggleSelectAll = () => {
    if (selectedShiftId || isReadOnly) return;
    if (formData.employee_ids.length === employees.length) {
        setFormData({ ...formData, employee_ids: [] });
    } else {
        setFormData({ ...formData, employee_ids: employees.map(e => e._id) });
    }
  };

  // ✅ handleSubmit (Fixed Timezone Issue)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return; 

    if (formData.employee_ids.length === 0 || !formData.start_date_time || !formData.end_date_time) {
      return Alert.warning(t("schedule.validation.requiredFields"));
    }

    // ✅ FIX: Create Date objects directly from input value
    const start = new Date(formData.start_date_time);
    const end = new Date(formData.end_date_time);

    try {
      show();
      
      if (selectedShiftId) {
        await shiftService.updateShift(selectedShiftId, {
          employee_id: formData.employee_ids[0],
          title: formData.title,
          start_date_time: start, // ✅ Send Date object
          end_date_time: end,     // ✅ Send Date object
          shift_type: formData.shift_type,
          location: formData.location,
          notes: formData.notes
        });
        Alert.success(t("schedule.success.updated"));
      } else {
        if (formData.employee_ids.length === 1) {
          await shiftService.createShift({
            ...formData,
            start_date_time: start, // ✅ Send Date object
            end_date_time: end,     // ✅ Send Date object
            employee_id: formData.employee_ids[0]
          });
        } else {
          const shiftsArray = formData.employee_ids.map(empId => ({
            employee_id: empId,
            title: formData.title,
            start_date_time: start, // ✅ Send Date object
            end_date_time: end,     // ✅ Send Date object
            shift_type: formData.shift_type,
            location: formData.location,
            notes: formData.notes
          }));
          await shiftService.createBulkShifts({ shifts: shiftsArray });
        }
        Alert.success(t("schedule.success.created"));
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error(err);
      Alert.error(err.response?.data?.message || t("schedule.errors.operationFailed"));
    } finally {
      hide();
    }
  };

  const handleDelete = async () => {
    if (isReadOnly) return;
    const confirmResult = await Alert.confirm(t("schedule.confirm.delete"));
    if (!confirmResult.isConfirmed) return;
    
    try {
      show();
      await shiftService.deleteShift(selectedShiftId);
      Alert.success(t("schedule.success.deleted"));
      handleCloseModal();
      fetchData();
    } catch (err) {
      Alert.error(err.response?.data?.message || t("schedule.errors.deleteFailed"));
    } finally {
      hide();
    }
  };

  // --- AI HANDLERS ---
  
  // ✅ Voice Input Logic
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return Alert.error(t("schedule.voice.browserNotSupported"));
    }

    const recognition = new SpeechRecognition();
    recognition.lang = micLang; // ✅ Use selected language
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
          setAiCommand(prev => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
          Alert.error(t("schedule.voice.microphoneBlocked"));
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if(!aiCommand.trim()) return;
    
    try {
      setIsGenerating(true); 
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const res = await apiClient.post("/api/shifts/ai-generate", { 
        command: aiCommand,
        timeZone: userTimeZone 
      });
      
      setAiPreview(res.data.data); 
    } catch (err) {
      Alert.error(t("schedule.ai.failedToUnderstand"));
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmAI_Shifts = async () => {
    if(!aiPreview || aiPreview.length === 0) return;
    
    try {
      show();
      await shiftService.createBulkShifts({ shifts: aiPreview });
      Alert.success(t("schedule.ai.shiftsCreated", { count: aiPreview.length }));
      setShowAIModal(false);
      setAiPreview(null);
      setAiCommand("");
      fetchData(); 
    } catch (err) {
      Alert.error(t("schedule.ai.failedToSave"));
    } finally {
      hide();
    }
  };

  const groupShiftsByDate = (shifts) => {
    if (!shifts) return {};
    return shifts.reduce((acc, shift) => {
      const date = new Date(shift.start_date_time).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(shift);
      return acc;
    }, {});
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen dark:text-slate-100">
      <style>{`
        .dark .fc { --fc-bg-event-opacity: 1; --fc-text-muted: rgb(148, 163, 184); --fc-border-color: rgb(51, 65, 85); }
        .dark .fc-button-primary { background-color: rgb(30, 58, 95); border-color: rgb(30, 58, 95); color: white; }
        .dark .fc-button-primary:hover { background-color: rgb(45, 80, 128); }
        .dark .fc-daygrid-day { background-color: rgb(30, 41, 59); }
        .dark .fc-col-header-cell { background-color: rgb(30, 41, 59); color: rgb(226, 232, 240); border-color: rgb(51, 65, 85); }
        .dark .fc-timegrid-slot { height: 3em; border-color: rgb(51, 65, 85); }
        .dark .fc-timegrid-cell { border-color: rgb(51, 65, 85); background-color: rgb(30, 41, 59); }
        .dark .fc-toolbar { color: rgb(226, 232, 240); }
        
        @keyframes pulse-ring {
            0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-pulse-ring { animation: pulse-ring 1.5s cubic-bezier(0.25, 0.8, 0.25, 1) infinite; }
      `}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("schedule.title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {t("schedule.subtitle")}
          </p>
        </div>
        
        <div className="hidden md:flex gap-3 text-xs">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {t("schedule.legend.scheduled")}</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {t("schedule.legend.active")}</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> {t("schedule.legend.completed")}</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {t("schedule.legend.missed")}</span>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={() => setShowAIModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition shadow-sm active:scale-95"
            >
                <Sparkles size={18} /> {t("schedule.aiAssist")}
            </button>

            <button 
            onClick={() => { handleCloseModal(); setIsModalOpen(true); }}
            className="bg-[#112D4E] hover:bg-[#274b74] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition shadow-sm active:scale-95"
            >
            <Plus size={18} /> {t("schedule.addShift")}
            </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          events={events}
          height="auto"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          eventClick={handleEventClick}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }}
        />
      </div>

      {/* Add/Edit Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn overflow-hidden flex flex-col max-h-[90vh] dark:text-slate-100">
            
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center ${isReadOnly ? 'bg-gray-100 dark:bg-slate-700' : 'bg-slate-50 dark:bg-slate-700'}`}>
              <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">
                    {selectedShiftId 
                      ? (isReadOnly ? t("schedule.modal.viewCompleted") : t("schedule.modal.editShift")) 
                      : t("schedule.modal.addShift")
                    }
                  </h3>
                  {isReadOnly && <span className="bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={10}/> {t("schedule.modal.readOnly")}</span>}
              </div>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-500 dark:text-slate-400 transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {isReadOnly && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                      <AlertCircle size={16} className="mt-0.5" />
                      <p>{t("schedule.modal.readOnlyWarning")}</p>
                  </div>
              )}

              {/* New Checkbox Employee Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">
                      {t("schedule.modal.assignTo")} <span className="text-red-500">*</span>
                    </label>
                    {!selectedShiftId && !isReadOnly && (
                        <button 
                            type="button" 
                            onClick={toggleSelectAll}
                            className="text-xs text-blue-600 hover:underline font-medium"
                        >
                            {formData.employee_ids.length === employees.length 
                              ? t("schedule.modal.deselectAll") 
                              : t("schedule.modal.selectAll")
                            }
                        </button>
                    )}
                </div>
                
                <div className={`border border-slate-200 rounded-xl overflow-hidden h-40 overflow-y-auto ${isReadOnly ? 'bg-gray-50' : 'bg-white'}`}>
                    {employees.length > 0 ? employees.map(emp => {
                        const isSelected = formData.employee_ids.includes(emp._id);
                        return (
                            <div 
                                key={emp._id} 
                                onClick={() => toggleEmployee(emp._id)}
                                className={`flex items-center gap-3 p-2.5 border-b border-slate-50 cursor-pointer transition hover:bg-slate-50 ${isSelected ? 'bg-blue-50/50' : ''} ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}
                            >
                                <div className={`text-slate-400 ${isSelected ? 'text-blue-600' : ''}`}>
                                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{emp.name}</p>
                                    <p className="text-xs text-slate-400">{emp.position || t("schedule.modal.defaultPosition")}</p>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="p-4 text-center text-sm text-slate-400">{t("schedule.modal.noEmployees")}</p>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-1.5 text-right">
                    {t("schedule.modal.selectedCount", { count: formData.employee_ids.length })}
                </p>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    {t("schedule.modal.shiftTitle")}
                  </label>
                  <input 
                    disabled={isReadOnly}
                    type="text" 
                    placeholder={t("schedule.modal.titlePlaceholder")}
                    className={`w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'dark:bg-slate-700 dark:text-slate-100'}`}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    {t("schedule.modal.type")}
                  </label>
                  <select 
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'bg-white dark:bg-slate-700 dark:text-slate-100'}`}
                    value={formData.shift_type}
                    onChange={(e) => setFormData({...formData, shift_type: e.target.value})}
                  >
                    <option value="regular">{t("schedule.shiftTypes.regular")}</option>
                    <option value="overtime">{t("schedule.shiftTypes.overtime")}</option>
                    <option value="holiday">{t("schedule.shiftTypes.holiday")}</option>
                    <option value="weekend">{t("schedule.shiftTypes.weekend")}</option>
                    <option value="emergency">{t("schedule.shiftTypes.emergency")}</option>
                  </select>
                  
                  {['overtime', 'holiday', 'weekend', 'emergency'].includes(formData.shift_type) && !isReadOnly && (
                     <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-amber-600 font-medium bg-amber-50 p-1.5 rounded-lg">
                        <Info size={12} />
                        {t("schedule.modal.overtimeWarning")}
                     </div>
                  )}

                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    {t("schedule.modal.startTime")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                      disabled={isReadOnly}
                      required
                      type="datetime-local"
                      className={`w-full pl-10 pr-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'dark:bg-slate-700 dark:text-slate-100'}`}
                      value={formData.start_date_time}
                      onChange={(e) => setFormData({...formData, start_date_time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    {t("schedule.modal.endTime")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                      disabled={isReadOnly}
                      required
                      type="datetime-local"
                      className={`w-full pl-10 pr-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'dark:bg-slate-700 dark:text-slate-100'}`}
                      value={formData.end_date_time}
                      onChange={(e) => setFormData({...formData, end_date_time: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  {t("schedule.modal.location")}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    disabled={isReadOnly}
                    type="text" 
                    placeholder={t("schedule.modal.locationPlaceholder")}
                    className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'dark:bg-slate-700 dark:text-slate-100'}`}
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  {t("schedule.modal.notes")}
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                  <textarea 
                    disabled={isReadOnly}
                    rows="2"
                    placeholder={t("schedule.modal.notesPlaceholder")}
                    className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'dark:bg-slate-700 dark:text-slate-100'}`}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                {selectedShiftId && !isReadOnly && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="px-4 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-700 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition flex items-center justify-center"
                    title={t("schedule.modal.deleteShift")}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                
                <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition">
                  {isReadOnly ? t("schedule.modal.close") : t("schedule.modal.cancel")}
                </button>
                
                {!isReadOnly && (
                  <button type="submit" className="flex-1 py-2.5 bg-[#112D4E] dark:bg-[#1e3a5f] text-white rounded-xl hover:bg-[#274b74] dark:hover:bg-[#2d5080] font-medium transition shadow-md flex items-center justify-center gap-2">
                    {selectedShiftId ? (
                      <><Save size={18} /> {t("schedule.modal.updateShift")}</>
                    ) : (
                      t("schedule.modal.createShift")
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ✅ AI Assistant Modal (Enhanced UX + Voice) */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-yellow-300" />
                <div>
                    <h3 className="font-bold text-xl">{t("schedule.ai.modalTitle")}</h3>
                    <p className="text-purple-200 text-xs">{t("schedule.ai.poweredBy")}</p>
                </div>
              </div>
              <button onClick={() => setShowAIModal(false)} className="p-1 hover:bg-white/20 rounded-full"><X size={20}/></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {!aiPreview ? (
                <div className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                      <p className="text-sm text-purple-800 dark:text-purple-300 font-medium mb-1">{t("schedule.ai.howItWorks")}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">{t("schedule.ai.description")}</p>
                      <p className="text-xs text-slate-500 mt-2 italic">{t("schedule.ai.example")}</p>
                  </div>
                  
                  <div className="relative">
                      <textarea
                        className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 dark:text-white resize-none text-base pr-20" // Increased padding for 2 buttons
                        rows={4}
                        placeholder={t("schedule.ai.commandPlaceholder")}
                        value={aiCommand}
                        onChange={(e) => setAiCommand(e.target.value)}
                        disabled={isGenerating}
                      ></textarea>
                      
                      {/* ✅ Language Toggle */}
                      <button 
                        onClick={() => setMicLang(prev => prev === 'ar-EG' ? 'en-US' : 'ar-EG')}
                        className="absolute bottom-3 right-14 h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-200 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 shadow-sm"
                        title={t("schedule.voice.switchLanguage")}
                      >
                         <Languages size={14} className="text-purple-500" />
                         {micLang === 'ar-EG' ? 'AR' : 'EN'}
                      </button>

                      {/* ✅ Microphone Button */}
                      <button 
                        onClick={toggleListening}
                        className={`absolute bottom-3 right-3 h-9 w-9 flex items-center justify-center rounded-full transition-all duration-300 shadow-md ${
                            isListening 
                            ? "bg-red-500 text-white animate-pulse-ring" 
                            : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                        }`}
                        title={isListening ? t("schedule.voice.stopListening") : t("schedule.voice.startListening")}
                      >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                      </button>
                  </div>

                  <Button 
                    onClick={handleAIGenerate} 
                    disabled={!aiCommand.trim() || isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 flex justify-center items-center gap-2"
                  >
                    {isGenerating ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            {t("schedule.ai.analyzing")}
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} /> {t("schedule.ai.generatePlan")}
                        </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <CheckSquare className="text-emerald-500" size={18}/>
                        {t("schedule.ai.previewTitle", { count: aiPreview.length })}
                    </h4>
                    {/* <button onClick={() => setAiPreview(null)} className="text-xs text-red-500 hover:underline">{t("schedule.ai.discard")}</button> */}
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 max-h-80 overflow-y-auto space-y-4 custom-scrollbar">
                    {Object.entries(groupShiftsByDate(aiPreview)).map(([date, shifts]) => (
                        <div key={date}>
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 sticky top-0 bg-slate-50 dark:bg-slate-900 py-1">{date}</h5>
                            <div className="space-y-2">
                                {shifts.map((s, idx) => {
                                    const empName = employees.find(e => e._id === s.employee_id)?.name || t("schedule.unknown");
                                    return (
                                        <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                                                    {empName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{empName}</p>
                                                    <p className="text-xs text-slate-500">{t(`schedule.shiftTypes.${s.shift_type}`)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    <Clock size={12} className="text-slate-400"/>
                                                    {new Date(s.start_date_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                                                    {new Date(s.end_date_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                </div>
                                                {s.notes && <p className="text-[10px] text-slate-400 italic max-w-[150px] truncate">{s.notes}</p>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                     {/* ✅ Improved Discard Button */}
                     <button 
                        onClick={() => setAiPreview(null)} 
                        className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 font-semibold flex items-center justify-center gap-2 transition"
                     >
                        <RotateCcw size={18} /> {t("schedule.ai.discard")}
                     </button>
                     <Button onClick={confirmAI_Shifts} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-semibold">
                        {t("schedule.ai.confirmSave")}
                     </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
