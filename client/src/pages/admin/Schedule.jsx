import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLoading } from "../../contexts/LoaderContext";
import shiftService from "../../api/services/admin/shiftService";
import apiClient from "../../api/apiClient";
import { Plus, X, Clock, MapPin, FileText, Users, Trash2, Save, AlertCircle, Lock, CheckSquare, Square, Info } from "lucide-react";

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const { show, hide } = useLoading();
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false); // ✅ حالة لمنع التعديل على الماضي

  const [formData, setFormData] = useState({
    employee_ids: [], 
    title: "",
    start_date_time: "",
    end_date_time: "",
    shift_type: "regular",
    location: "",
    notes: ""
  });

  // 1. Fetch Shifts & Employees
  const fetchData = async () => {
    try {
      show();
      const [shiftsRes, employeesRes] = await Promise.all([
        // ✅ طلب 1000 شيفت لتجاوز الـ Pagination الافتراضي (50)
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
  }, []);

  // ✅ Helper: Map DB shift to Calendar Event with AUTOMATIC STATUS COLORING
  const mapShiftToEvent = (s) => {
    const now = new Date();
    // ✅ تحويل النصوص إلى كائنات Date لضمان العرض الصحيح في Week/Day View
    const start = new Date(s.start_date_time);
    const end = new Date(s.end_date_time);
    const isPast = end < now;

    // Default color based on type
    let color = getShiftColor(s.shift_type); 
    let borderColor = color;

    // Override color based on Status & Time
    if (s.status === 'completed') {
      color = '#9ca3af'; // Gray (Archived/Done)
      borderColor = '#d1d5db';
    } else if (s.status === 'in_progress') {
      color = '#10b981'; // Emerald (Active Now)
      borderColor = '#059669';
    } else if (isPast && s.status === 'scheduled') {
      color = '#ef4444'; // Red (Missed / No Show)
      borderColor = '#b91c1c';
    }

    return {
      id: s._id,
      title: `${s.employee_id?.name || "Unknown"} - ${s.title}`,
      start: start, // ✅ تمرير كائن Date
      end: end,     // ✅ تمرير كائن Date
      backgroundColor: color,
      borderColor: borderColor,
      allDay: false, // ✅ إجبار الحدث ليكون بتوقيت محدد وليس طوال اليوم
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
      case "regular": return "#3b82f6"; // Blue
      case "overtime": return "#f59e0b"; // Amber
      case "holiday": return "#8b5cf6"; // Purple
      case "weekend": return "#ec4899"; // Pink
      case "emergency": return "#ef4444"; // Red
      default: return "#6b7280";
    }
  };

  // Helper: Format Date for Input
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // 2. Handle Event Click (Open Edit Mode)
  const handleEventClick = (info) => {
    const event = info.event;
    const props = event.extendedProps;

    // ✅ منطق الحماية: لو الشيفت مكتمل، نخليه قراءة فقط
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

  // 3. Reset Form & Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShiftId(null);
    setIsReadOnly(false); // Reset readonly
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

  // ✅ Toggle Employee Selection Logic (Checkboxes)
  const toggleEmployee = (empId) => {
    if (isReadOnly) return;

    setFormData(prev => {
        const currentIds = prev.employee_ids;
        // Edit Mode: Allow only one selection (Radio behavior)
        if (selectedShiftId) {
            return { ...prev, employee_ids: [empId] }; 
        }
        // Create Mode: Toggle selection
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

  // 4. Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return; // منع الإرسال لو قراءة فقط

    if (formData.employee_ids.length === 0 || !formData.start_date_time || !formData.end_date_time) {
      return alert("Please select at least one employee and time range.");
    }

    try {
      show();
      
      if (selectedShiftId) {
        // Update
        await shiftService.updateShift(selectedShiftId, {
          employee_id: formData.employee_ids[0],
          title: formData.title,
          start_date_time: formData.start_date_time,
          end_date_time: formData.end_date_time,
          shift_type: formData.shift_type,
          location: formData.location,
          notes: formData.notes
        });
        alert("Shift updated successfully!");
      } else {
        // Create
        if (formData.employee_ids.length === 1) {
          await shiftService.createShift({
            ...formData,
            employee_id: formData.employee_ids[0]
          });
        } else {
          const shiftsArray = formData.employee_ids.map(empId => ({
            employee_id: empId,
            title: formData.title,
            start_date_time: formData.start_date_time,
            end_date_time: formData.end_date_time,
            shift_type: formData.shift_type,
            location: formData.location,
            notes: formData.notes
          }));
          await shiftService.createBulkShifts({ shifts: shiftsArray });
        }
        alert("Shift(s) created successfully!");
      }

      handleCloseModal();
      fetchData(); // ✅ إعادة تحميل البيانات لتظهر التغييرات
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      hide();
    }
  };

  // 5. Handle Delete
  const handleDelete = async () => {
    if (isReadOnly) return; // منع الحذف لو قراءة فقط
    if (!window.confirm("Are you sure you want to delete this shift?")) return;
    
    try {
      show();
      await shiftService.deleteShift(selectedShiftId);
      alert("Shift deleted successfully!");
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete shift");
    } finally {
      hide();
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen dark:text-slate-100">
      <style>{`
        .dark .fc {
          --fc-bg-event-opacity: 1;
          --fc-text-muted: rgb(148, 163, 184);
          --fc-border-color: rgb(51, 65, 85);
        }
        .dark .fc-button-primary {
          background-color: rgb(30, 58, 95);
          border-color: rgb(30, 58, 95);
          color: white;
        }
        .dark .fc-button-primary:hover {
          background-color: rgb(45, 80, 128);
        }
        .dark .fc-button-primary.fc-button-active {
          background-color: rgb(45, 80, 128);
          border-color: rgb(45, 80, 128);
        }
        .dark .fc-button-primary:not(:disabled).fc-button-active:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
        .dark .fc-daygrid-day {
          background-color: rgb(30, 41, 59);
        }
        .dark .fc-daygrid-day:hover {
          background-color: rgb(51, 65, 85);
        }
        .dark .fc-daygrid-day.fc-other-month {
          background-color: rgb(15, 23, 42);
        }
        .dark .fc-col-header-cell {
          background-color: rgb(30, 41, 59);
          color: rgb(226, 232, 240);
          border-color: rgb(51, 65, 85);
        }
        .dark .fc-timegrid-slot {
          height: 3em;
          border-color: rgb(51, 65, 85);
        }
        .dark .fc-timegrid-slot:first-child {
          border-color: rgb(51, 65, 85);
        }
        .dark .fc-timegrid-cell {
          border-color: rgb(51, 65, 85);
          background-color: rgb(30, 41, 59);
        }
        .dark .fc-timegrid-cell:hover {
          background-color: rgb(45, 65, 95);
        }
        .dark .fc-daygrid-day-number {
          color: rgb(226, 232, 240);
        }
        .dark .fc-daygrid-day-frame {
          background-color: rgb(30, 41, 59);
        }
        .dark .fc-button-group {
          gap: 0.2rem;
        }
        .dark .fc-toolbar {
          color: rgb(226, 232, 240);
        }
        .dark .fc-toolbar-title {
          font-size: 1.5rem;
          color: rgb(226, 232, 240);
          font-weight: 600;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Schedule Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Plan and manage employee shifts.</p>
        </div>
        
        <div className="hidden md:flex gap-3 text-xs">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Scheduled</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Completed</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Missed</span>
        </div>

        <button 
          onClick={() => { handleCloseModal(); setIsModalOpen(true); }}
          className="bg-[#112D4E] hover:bg-[#274b74] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition shadow-sm active:scale-95"
        >
          <Plus size={18} /> Add Shift
        </button>
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
          slotMinTime="00:00:00" // ✅ بداية اليوم من منتصف الليل
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
                    {selectedShiftId ? (isReadOnly ? "View Completed Shift" : "Edit Shift") : "Add New Shift"}
                  </h3>
                  {isReadOnly && <span className="bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={10}/> Read Only</span>}
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
                      <p>This shift is completed and cannot be edited to preserve historical records.</p>
                  </div>
              )}

              {/* ✅ New Checkbox Employee Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">
                      Assign To <span className="text-red-500">*</span>
                    </label>
                    {!selectedShiftId && !isReadOnly && (
                        <button 
                            type="button" 
                            onClick={toggleSelectAll}
                            className="text-xs text-blue-600 hover:underline font-medium"
                        >
                            {formData.employee_ids.length === employees.length ? "Deselect All" : "Select All"}
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
                                    <p className="text-xs text-slate-400">{emp.position || "Employee"}</p>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="p-4 text-center text-sm text-slate-400">No employees found.</p>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-1.5 text-right">
                    {formData.employee_ids.length} employee(s) selected
                </p>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Shift Title</label>
                  <input 
                    disabled={isReadOnly}
                    type="text" 
                    placeholder="e.g. Morning Shift"
                    className={`w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'dark:bg-slate-700 dark:text-slate-100'}`}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Type</label>
                  <select 
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'bg-white dark:bg-slate-700 dark:text-slate-100'}`}
                    value={formData.shift_type}
                    onChange={(e) => setFormData({...formData, shift_type: e.target.value})}
                  >
                    <option value="regular">Regular</option>
                    <option value="overtime">Overtime</option>
                    <option value="holiday">Holiday</option>
                    <option value="weekend">Weekend</option>
                    <option value="emergency">Emergency</option>
                  </select>
                  
                  {/* ✅ UI Hint: التعديل للتوافق مع منطق الباك إند */}
                  {['overtime', 'holiday', 'weekend', 'emergency'].includes(formData.shift_type) && !isReadOnly && (
                     <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-amber-600 font-medium bg-amber-50 p-1.5 rounded-lg">
                        <Info size={12} />
                        All hours in this shift will be counted as Overtime.
                     </div>
                  )}

                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Start Time <span className="text-red-500">*</span></label>
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
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">End Time <span className="text-red-500">*</span></label>
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
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    disabled={isReadOnly}
                    type="text" 
                    placeholder="e.g. Main Branch, Remote..."
                    className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'dark:bg-slate-700 dark:text-slate-100'}`}
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                  <textarea 
                    disabled={isReadOnly}
                    rows="2"
                    placeholder="Add optional notes..."
                    className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isReadOnly ? 'bg-gray-50 dark:bg-slate-700' : 'dark:bg-slate-700 dark:text-slate-100'}`}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                {/* زر الحذف يختفي لو الشيفت مكتمل */}
                {selectedShiftId && !isReadOnly && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="px-4 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-700 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition flex items-center justify-center"
                    title="Delete Shift"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                
                <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition">
                  {isReadOnly ? "Close" : "Cancel"}
                </button>
                
                {/* زر الحفظ يختفي لو الشيفت مكتمل */}
                {!isReadOnly && (
                  <button type="submit" className="flex-1 py-2.5 bg-[#112D4E] dark:bg-[#1e3a5f] text-white rounded-xl hover:bg-[#274b74] dark:hover:bg-[#2d5080] font-medium transition shadow-md flex items-center justify-center gap-2">
                    {selectedShiftId ? <><Save size={18} /> Update Shift</> : "Create Shift"}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}