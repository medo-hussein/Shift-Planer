import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLoading } from "../../contexts/LoaderContext";
import shiftService from "../../api/services/admin/shiftService";
import apiClient from "../../api/apiClient";
import { Plus, X, Clock, MapPin, FileText, Users, Trash2, Save, AlertCircle, Lock } from "lucide-react";

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
        // ✅ طلب 1000 شيفت لتجاوز الـ Pagination الافتراضي وضمان ظهور كافة البيانات
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

    // Override color based on Status & Time (The "Automatic" Logic)
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
        status: s.status, // ✅ نحتاج الحالة
        isPast: isPast    // ✅ نحتاج نعرف لو ماضي
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
      fetchData(); // ✅ إعادة تحميل البيانات لتظهر الشيفتات الجديدة
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
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedule Management</h1>
          <p className="text-slate-500 text-sm">Plan and manage employee shifts.</p>
        </div>
        
        {/* مفتاح الألوان (Legend) */}
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          height="auto"
          slotMinTime="00:00:00" // ✅ بداية اليوم من منتصف الليل لرؤية كل الشيفتات
          slotMaxTime="24:00:00"
          allDaySlot={false}
          eventClick={handleEventClick}
        />
      </div>

      {/* Add/Edit Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${isReadOnly ? 'bg-gray-100' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">
                    {selectedShiftId ? (isReadOnly ? "View Completed Shift" : "Edit Shift") : "Add New Shift"}
                  </h3>
                  {isReadOnly && <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={10}/> Read Only</span>}
              </div>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {isReadOnly && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 text-sm text-yellow-800">
                      <AlertCircle size={16} className="mt-0.5" />
                      <p>This shift is completed and cannot be edited to preserve historical records.</p>
                  </div>
              )}

              {/* Employees */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Assign To <span className="text-red-500">*</span>
                  {!selectedShiftId && !isReadOnly && (
                    <span className="ml-2 text-[10px] normal-case font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Hold Ctrl to select multiple
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 text-slate-400" size={18} />
                  <select 
                    disabled={isReadOnly} // 🔒 تعطيل
                    multiple={!selectedShiftId}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-32 ${isReadOnly ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                    value={formData.employee_ids}
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      if (selectedShiftId && options.length > 1) return;
                      setFormData({ ...formData, employee_ids: options });
                    }}
                  >
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shift Title</label>
                  <input 
                    disabled={isReadOnly}
                    type="text" 
                    placeholder="e.g. Morning Shift"
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select 
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-gray-50' : 'bg-white'}`}
                    value={formData.shift_type}
                    onChange={(e) => setFormData({...formData, shift_type: e.target.value})}
                  >
                    <option value="regular">Regular</option>
                    <option value="overtime">Overtime</option>
                    <option value="holiday">Holiday</option>
                    <option value="weekend">Weekend</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      disabled={isReadOnly}
                      required
                      type="datetime-local"
                      className={`w-full pl-10 pr-2 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isReadOnly ? 'bg-gray-50' : ''}`}
                      value={formData.start_date_time}
                      onChange={(e) => setFormData({...formData, start_date_time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Time <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      disabled={isReadOnly}
                      required
                      type="datetime-local"
                      className={`w-full pl-10 pr-2 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isReadOnly ? 'bg-gray-50' : ''}`}
                      value={formData.end_date_time}
                      onChange={(e) => setFormData({...formData, end_date_time: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    disabled={isReadOnly}
                    type="text" 
                    placeholder="e.g. Main Branch, Remote..."
                    className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                  <textarea 
                    disabled={isReadOnly}
                    rows="2"
                    placeholder="Add optional notes..."
                    className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isReadOnly ? 'bg-gray-50' : ''}`}
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
                    className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 font-medium transition flex items-center justify-center"
                    title="Delete Shift"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                
                <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition">
                  {isReadOnly ? "Close" : "Cancel"}
                </button>
                
                {/* زر الحفظ يختفي لو الشيفت مكتمل */}
                {!isReadOnly && (
                  <button type="submit" className="flex-1 py-2.5 bg-[#112D4E] text-white rounded-xl hover:bg-[#274b74] font-medium transition shadow-md flex items-center justify-center gap-2">
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