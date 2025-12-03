import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLoading } from "../../contexts/LoaderContext";
import shiftService from "../../api/services/admin/shiftService";
import apiClient from "../../api/apiClient";
import { Plus, X, Clock, MapPin, FileText, Users, Trash2, Save } from "lucide-react";

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const { show, hide } = useLoading();
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState(null); // ✅ لتخزين ID الشفت المراد تعديله

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
        shiftService.getBranchShifts(),
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

  // ✅ Helper: Map DB shift to Calendar Event with MORE DATA for editing
  const mapShiftToEvent = (s) => ({
    id: s._id,
    title: `${s.employee_id?.name || "Unknown"} - ${s.title}`,
    start: s.start_date_time,
    end: s.end_date_time,
    backgroundColor: getShiftColor(s.shift_type),
    borderColor: getShiftColor(s.shift_type),
    extendedProps: { 
      // نحفظ البيانات الخام عشان نرجعها للفورم لما نضغط تعديل
      employeeId: s.employee_id?._id,
      rawTitle: s.title,
      type: s.shift_type,
      location: s.location,
      notes: s.notes
    },
  });

  const getShiftColor = (type) => {
    switch (type) {
      case "regular": return "#3b82f6";
      case "overtime": return "#f59e0b";
      case "holiday": return "#10b981";
      case "emergency": return "#ef4444";
      default: return "#6b7280";
    }
  };

  // ✅ Helper: Format Date for Input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    // Adjust for timezone offset manually to keep local time correct in input
    const pad = (n) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // 2. Handle Event Click (Open Edit Mode)
  const handleEventClick = (info) => {
    const event = info.event;
    const props = event.extendedProps;

    // ملء الفورم ببيانات الشفت المضغوط عليه
    setFormData({
      employee_ids: [props.employeeId], // عند التعديل نحدد موظف واحد فقط
      title: props.rawTitle,
      start_date_time: formatDateForInput(event.start),
      end_date_time: formatDateForInput(event.end),
      shift_type: props.type,
      location: props.location || "",
      notes: props.notes || ""
    });

    setSelectedShiftId(event.id); // تحديد الـ ID عشان نعرف إن ده تعديل
    setIsModalOpen(true);
  };

  // 3. Reset Form & Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShiftId(null); // نرجع لوضع الإضافة
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

  // 4. Handle Submit (Create OR Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.employee_ids.length === 0 || !formData.start_date_time || !formData.end_date_time) {
      return alert("Please select at least one employee and time range.");
    }

    try {
      show();
      
      // ✅ Case A: UPDATE (Editing existing shift)
      if (selectedShiftId) {
        await shiftService.updateShift(selectedShiftId, {
          employee_id: formData.employee_ids[0], // عند التعديل نأخذ أول موظف
          title: formData.title,
          start_date_time: formData.start_date_time,
          end_date_time: formData.end_date_time,
          shift_type: formData.shift_type,
          location: formData.location,
          notes: formData.notes
        });
        alert("Shift updated successfully!");
      } 
      // ✅ Case B: CREATE NEW (Single or Bulk)
      else {
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
      fetchData(); 
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      hide();
    }
  };

  // 5. Handle Delete
  const handleDelete = async () => {
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
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          eventClick={handleEventClick} // ✅ تم تفعيل الضغط للتعديل
        />
      </div>

      {/* Add/Edit Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">
                {selectedShiftId ? "Edit Shift" : "Add New Shift"}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {/* Multi-Select Employees */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Assign To <span className="text-red-500">*</span>
                  {!selectedShiftId && (
                    <span className="ml-2 text-[10px] normal-case font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Hold Ctrl to select multiple
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 text-slate-400" size={18} />
                  <select 
                    multiple={!selectedShiftId} // ✅ منع التحديد المتعدد عند التعديل
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white h-32"
                    value={formData.employee_ids}
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      // عند التعديل نسمح فقط باختيار واحد
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
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {formData.employee_ids.length} employee(s) selected
                  </p>
                </div>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shift Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Morning Shift"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                      required
                      type="datetime-local"
                      className="w-full pl-10 pr-2 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                      required
                      type="datetime-local"
                      className="w-full pl-10 pr-2 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    type="text" 
                    placeholder="e.g. Main Branch, Remote..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
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
                    rows="2"
                    placeholder="Add optional notes..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                {/* ✅ زر الحذف يظهر فقط عند التعديل */}
                {selectedShiftId && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 font-medium transition flex items-center justify-center"
                    title="Delete Shift"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                
                <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition">Cancel</button>
                
                <button type="submit" className="flex-1 py-2.5 bg-[#112D4E] text-white rounded-xl hover:bg-[#274b74] font-medium transition shadow-md flex items-center justify-center gap-2">
                  {selectedShiftId ? <><Save size={18} /> Update Shift</> : "Create Shift"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}