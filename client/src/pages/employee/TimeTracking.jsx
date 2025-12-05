import React, { useState, useEffect } from 'react';
import { Clock, Coffee, LogOut, Play, Pause, Calendar, TrendingUp } from 'lucide-react';
import Button from '../../utils/Button';
import apiClient from '../../api/apiClient';
import { useLoading } from '../../contexts/LoaderContext';
import { useToast } from '../../hooks/useToast';
import { Alert } from '../../utils/alertService'; 

const TimeTracking = () => {
  // --- States ---
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- Inputs ---
  const [clockOutNotes, setClockOutNotes] = useState('');
  const [breakNotes, setBreakNotes] = useState('');
  const [location, setLocation] = useState('Office');

  // --- Hooks ---
  const { show: showGlobalLoading, hide: hideGlobalLoading } = useLoading();
  const { success, error: showError } = useToast();

  // --- Helper: Get Local Date String (YYYY-MM-DD) ---
  const getLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Fetch Functions ---
  const fetchTodayStatus = async () => {
    try {
      const response = await apiClient.get('/api/employee/attendance/today-status');
      setTodayStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const localEndDate = getLocalDateString(today);
      const localStartDate = getLocalDateString(startOfMonth);

      const response = await apiClient.get('/api/employee/attendance', {
        params: {
          start_date: localStartDate,
          end_date: localEndDate,
          limit: 30
        }
      });

      setAttendanceHistory(response.data.data?.records || []);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const fetchSummaryStats = async () => {
    try {
      const response = await apiClient.get('/api/attendance/my-summary');
      setSummaryStats(response.data);
    } catch (error) {
      console.error('Error fetching summary stats:', error);
    }
  };

  // --- Initial Load ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTodayStatus(),
          fetchAttendanceHistory(),
          fetchSummaryStats()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // --- Action Handlers ---

  const handleClockIn = async () => {
    try {
      showGlobalLoading();
      await apiClient.post('/api/attendance/clock-in', { location, notes: "" });
      
      await Promise.all([
        fetchTodayStatus(),
        fetchAttendanceHistory()
      ]);
      success('Clocked in successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to clock in';
      Alert.error(errorMsg, "Clock In Failed");
    } finally {
      hideGlobalLoading();
    }
  };

  const handleClockOut = async () => {
    try {
      showGlobalLoading();
      await apiClient.post('/api/attendance/clock-out', { notes: clockOutNotes });
      await Promise.all([
        fetchTodayStatus(), 
        fetchAttendanceHistory(), 
        fetchSummaryStats()
      ]);
      setClockOutNotes('');
      success('Clocked out successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to clock out');
    } finally {
      hideGlobalLoading();
    }
  };

  const handleStartBreak = async () => {
    try {
      showGlobalLoading();
      await apiClient.post('/api/attendance/break/start', { notes: breakNotes });
      
      await Promise.all([
        fetchTodayStatus(),
        fetchAttendanceHistory() 
      ]);
      
      setBreakNotes('');
      success('Break started! Enjoy your time ☕');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to start break');
    } finally {
      hideGlobalLoading();
    }
  };

  const handleEndBreak = async () => {
    try {
      showGlobalLoading();
      await apiClient.post('/api/attendance/break/end', { notes: breakNotes });
      
      await Promise.all([
        fetchTodayStatus(),
        fetchAttendanceHistory()
      ]);

      setBreakNotes('');
      success('Break ended! Welcome back 💪');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to end break');
    } finally {
      hideGlobalLoading();
    }
  };

  // --- Helpers ---
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const calculateDuration = (startTime) => {
    if (!startTime) return '0h 0m';
    const start = new Date(startTime);
    const end = new Date();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // --- Derived State Logic ---
  
  const todayRecord = attendanceHistory.find(r => 
    new Date(r.date).toDateString() === new Date().toDateString()
  );
  
  const isOnBreak = todayRecord?.breaks?.some(b => b.start && !b.end);
  const activeBreakStart = todayRecord?.breaks?.find(b => b.start && !b.end)?.start;

  const stats = {
    totalHours: summaryStats?.this_week?.total_hours?.toFixed(1) || "0.0",
    totalOvertime: summaryStats?.this_week?.total_overtime?.toFixed(1) || "0.0",
    presentDays: summaryStats?.this_week?.present_days || 0,
    totalDays: summaryStats?.this_week?.total_days || 0
  };

  return (
    <div className="p-10 dark:bg-slate-900 dark:text-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Time Tracking</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Track your work hours and breaks</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-slate-400">Current Time</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
      </div>

      {/* Main Time Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Clock In/Out */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">Attendance Status</h2>
            
            {todayStatus ? (
              <div className="space-y-4">
                {/* Current Status Indicator */}
                <div className={`p-4 rounded-lg border ${
                  todayStatus.clocked_in ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Current Status</p>
                      <p className={`text-lg font-bold ${
                        todayStatus.clocked_in ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'
                      }`}>
                        {todayStatus.clocked_in ? (isOnBreak ? 'On Break ☕' : 'Clocked In ✅') : 'Not Clocked In'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      todayStatus.clocked_in ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-slate-700'
                    }`}>
                      <Clock size={24} className={todayStatus.clocked_in ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'} />
                    </div>
                  </div>
                </div>

                {/* Time Details Grid */}
                {todayStatus.check_in_time && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Check In</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatTime(todayStatus.check_in_time)}</p>
                    </div>
                    {todayStatus.check_out_time && (
                      <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Check Out</p>
                        <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatTime(todayStatus.check_out_time)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Shift Info */}
                {todayStatus.current_shift ? (
                  <div className="bg-sky-50 dark:bg-sky-900/30 p-4 rounded-lg border border-sky-200 dark:border-sky-800 mt-2">
                    <p className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase mb-1">Scheduled Shift</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-900 dark:text-sky-100">{todayStatus.current_shift.title || "Regular Shift"}</span>
                      <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
                        {formatTime(todayStatus.current_shift.start_date_time)} - {formatTime(todayStatus.current_shift.end_date_time)}
                      </span>
                    </div>
                  </div>
                ) : (
                  // ✅ رسالة تنبيه في حالة عدم وجود شيفت
                  <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-800 mt-2 text-center">
                     <p className="text-red-700 dark:text-red-400 font-medium">No shift scheduled for today</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">Loading status...</div>
            )}

            {/* Clock In/Out Actions */}
            <div className="mt-6">
              {!todayStatus?.clocked_in ? (
                <div className="space-y-3">
                   <div className="grid grid-cols-1 gap-3">
                    <input type="text" placeholder="Location (e.g. Office)" value={location} onChange={(e) => setLocation(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                  <Button variant="primary" className="w-full py-3 text-lg flex items-center justify-center gap-4" onClick={handleClockIn} disabled={loading}>
                    <Play size={20} className="mr-2" /> Clock In
                  </Button> 
                </div>
              ) : (
                 !todayStatus?.check_out_time && ( 
                  <div className="space-y-3">
                    <input type="text" placeholder="End of shift note..." value={clockOutNotes} onChange={(e) => setClockOutNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                    <Button variant="secondary" className="w-full py-3 text-lg bg-slate-800 hover:bg-slate-900" onClick={handleClockOut} disabled={loading || isOnBreak}>
                      <LogOut size={20} className="mr-2" /> Clock Out
                    </Button>
                  </div>
                 )
              )}
            </div>
          </div>

          {/* Right Side - Break Management */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">Break Management</h2>
              
              {/* Only show break controls if clocked in and not clocked out */}
              {todayStatus?.clocked_in && !todayStatus?.check_out_time ? (
                <div className="space-y-4">
                  {!isOnBreak ? ( 
                    <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 text-center">
                      <Coffee size={40} className="mx-auto text-gray-400 dark:text-slate-500 mb-3" />
                      <p className="text-gray-500 dark:text-slate-400 mb-4">Need a break?</p>
                      <div className="space-y-3">
                        <input type="text" placeholder="Break Reason (e.g. Lunch, Tea)" value={breakNotes} onChange={(e) => setBreakNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400" />
                        <Button variant="outline" className="w-full" onClick={handleStartBreak} disabled={loading}>
                          Start Break
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                      <div className="animate-pulse mb-3 inline-block p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                         <Coffee size={32} className="text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-1">You are on Break</p>
                      {activeBreakStart && (
                        <p className="text-yellow-600 dark:text-yellow-400 font-mono text-xl mb-4">Since: {formatTime(activeBreakStart)}</p>
                      )}
                      
                      <Button variant="primary" className="w-full bg-yellow-600 dark:bg-yellow-700 hover:bg-yellow-700 dark:hover:bg-yellow-600 border-transparent" onClick={handleEndBreak} disabled={loading}>
                        <Pause size={18} className="mr-2" /> End Break
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                  <Coffee size={48} className="text-gray-300 dark:text-slate-600 mb-3" />
                  <p className="text-gray-400 dark:text-slate-500">Clock in first to manage breaks</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatBox title="Total Hours" value={`${stats.totalHours}h`} icon={<Clock className="text-blue-600 dark:text-blue-400"/>} />
        <StatBox title="Overtime" value={`${stats.totalOvertime}h`} icon={<TrendingUp className="text-orange-600 dark:text-orange-400"/>} />
        <StatBox title="Present Days" value={stats.presentDays} icon={<Calendar className="text-green-600 dark:text-green-400"/>} />
        <StatBox title="Total Days" value={stats.totalDays} icon={<Calendar className="text-gray-600 dark:text-slate-400"/>} />
      </div>

      {/* Attendance History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
           <h2 className="font-semibold text-gray-800 dark:text-slate-50">Attendance History (Last 30 Days)</h2>
        </div>
        {attendanceHistory.length === 0 ? (
          <div className="text-center py-8"><p className="text-gray-500 dark:text-slate-400">No attendance records found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Check In</th>
                  <th className="py-3 px-4 font-medium">Check Out</th>
                  <th className="py-3 px-4 font-medium">Hours</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {attendanceHistory.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="py-3 px-4 text-gray-700 dark:text-slate-300">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td className="py-3 px-4 font-mono text-gray-600 dark:text-slate-400">{formatTime(record.check_in)}</td>
                    <td className="py-3 px-4 font-mono text-gray-600 dark:text-slate-400">{formatTime(record.check_out)}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{record.total_hours ? `${record.total_hours}h` : '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        record.status === 'present' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        record.status === 'late' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                      }`}>{record.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatBox = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex items-center justify-between">
    <div><p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">{title}</p><p className="text-xl font-bold text-gray-900 dark:text-slate-50 mt-1">{value}</p></div>
    <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-full">{icon}</div>
  </div>
);

export default TimeTracking;