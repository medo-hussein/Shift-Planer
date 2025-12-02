import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLoading } from "../../contexts/LoaderContext";
import shiftService from "../../api/services/admin/shiftService";
import apiClient from "../../api/apiClient";
import { Plus, X, User, Clock, MapPin, FileText, Users } from "lucide-react";

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const { show, hide, loading } = useLoading();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_ids: [], // ✅ Changed to array for bulk select
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
      // alert("Error loading data"); // Optional: suppress initial load error alert
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to map DB shift to Calendar Event
  const mapShiftToEvent = (s) => ({
    id: s._id,
    title: `${s.employee_id?.name || "Unknown"} - ${s.title}`,
    start: s.start_date_time,
    end: s.end_date_time,
    backgroundColor: getShiftColor(s.shift_type),
    borderColor: getShiftColor(s.shift_type),
    extendedProps: { 
      employee: s.employee_id?.name,
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

  // 2. Handle Multi-Select Change
  const handleEmployeeChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, employee_ids: selectedOptions });
  };

  // 3. Handle Submit (Smart Logic)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.employee_ids.length === 0 || !formData.start_date_time || !formData.end_date_time) {
      return alert("Please select at least one employee and time range.");
    }

    try {
      show();
      
      // ✅ Case A: Single Employee
      if (formData.employee_ids.length === 1) {
        await shiftService.createShift({
          ...formData,
          employee_id: formData.employee_ids[0] // Backend expects single ID
        });
      } 
      // ✅ Case B: Bulk Assignment
      else {
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
      setIsModalOpen(false);
      setFormData({ // Reset
        employee_ids: [], title: "", start_date_time: "", end_date_time: "", 
        shift_type: "regular", location: "", notes: "" 
      });
      fetchData(); 
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create shift(s)");
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
          onClick={() => setIsModalOpen(true)}
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
          eventClick={(info) => {
            alert(`Shift: ${info.event.title}\nType: ${info.event.extendedProps.type}\nNotes: ${info.event.extendedProps.notes || 'None'}`);
          }}
        />
      </div>

      {/* Add Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Add New Shift</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {/* Multi-Select Employees */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Assign To <span className="text-red-500">*</span>
                  <span className="ml-2 text-[10px] normal-case font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Hold Ctrl/Cmd to select multiple
                  </span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 text-slate-400" size={18} />
                  <select 
                    multiple // ✅ Enable multiple selection
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white h-32"
                    value={formData.employee_ids}
                    onChange={handleEmployeeChange}
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#112D4E] text-white rounded-xl hover:bg-[#274b74] font-medium transition shadow-md">
                  {formData.employee_ids.length > 1 ? `Create ${formData.employee_ids.length} Shifts` : "Create Shift"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}