import React, { useEffect, useState } from "react";
import { employeeService } from "../../api/services/employeeService";
import { useLoading } from "../../contexts/LoaderContext";
import { 
  Clock, Calendar, TrendingUp, User, MapPin, 
  Briefcase, CheckCircle2, AlertCircle 
} from "lucide-react";

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const { show, hide } = useLoading();

  useEffect(() => {
    const fetchData = async () => {
      try {
        show();
        const res = await employeeService.getDashboard();
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        hide();
      }
    };
    fetchData();
  }, []);

  if (!data) return null;

  const { today, weekly, branch, upcoming } = data;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Dashboard</h1>

      {/* 1. Today's Status Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full ${today.clocked_in ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}>
            <Clock size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {today.clocked_in ? "You are Clocked In" : "You are Clocked Out"}
            </h2>
            <p className="text-slate-500 text-sm">
              Current Status: <span className="font-medium capitalize">{today.current_status}</span>
            </p>
          </div>
        </div>
        
        {today.current_shift ? (
          <div className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 text-center">
            <p className="text-xs text-blue-600 uppercase font-bold mb-1">Current Shift</p>
            <p className="text-blue-900 font-bold">
              {new Date(today.current_shift.start_date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
              {new Date(today.current_shift.end_date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        ) : (
          <div className="text-slate-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> No active shift right now
          </div>
        )}
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Weekly Hours" value={`${weekly.total_hours.toFixed(1)}h`} icon={<Clock />} color="blue" />
        <StatCard title="Overtime" value={`${weekly.overtime.toFixed(1)}h`} icon={<TrendingUp />} color="orange" />
        <StatCard title="Days Present" value={`${weekly.present_days} / ${weekly.total_days}`} icon={<Calendar />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. Upcoming Shifts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600"/> Upcoming Shifts
          </h3>
          <div className="space-y-4">
            {upcoming.shifts.length > 0 ? upcoming.shifts.map(shift => (
              <div key={shift._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-white p-2 rounded-lg border border-slate-200 min-w-[60px]">
                    <p className="text-xs text-slate-500 uppercase">{new Date(shift.start_date_time).toLocaleDateString('en-US', {weekday: 'short'})}</p>
                    <p className="text-lg font-bold text-slate-800">{new Date(shift.start_date_time).getDate()}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{shift.title || "Regular Shift"}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> 
                      {new Date(shift.start_date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      {new Date(shift.end_date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full capitalize">
                  {shift.shift_type}
                </span>
              </div>
            )) : (
              <p className="text-slate-400 text-center py-4">No upcoming shifts scheduled.</p>
            )}
          </div>
        </div>

        {/* 4. Branch Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-purple-600"/> My Team
          </h3>
          
          <div className="mb-4">
             <p className="text-xs text-slate-400 uppercase font-bold">Branch</p>
             <p className="text-lg font-medium text-slate-700 flex items-center gap-2">
               <MapPin size={16} className="text-slate-400"/> {branch.name || "Main Branch"}
             </p>
          </div>

          {branch.admin && (
            <div className="pt-4 border-t border-slate-100">
               <p className="text-xs text-slate-400 uppercase font-bold mb-2">Branch Manager</p>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center font-bold">
                    {branch.admin.name.charAt(0)}
                 </div>
                 <div>
                    <p className="text-sm font-bold text-slate-700">{branch.admin.name}</p>
                    <p className="text-xs text-slate-500">{branch.admin.email}</p>
                 </div>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        orange: "bg-orange-50 text-orange-600",
        emerald: "bg-emerald-50 text-emerald-600"
    };
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
}