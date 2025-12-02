import React, { useState, useEffect } from 'react';
import { Clock, Coffee, LogOut, Play, Pause, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import Button from '../../utils/Button';
import apiClient from '../../api/apiClient';
import { useLoading } from '../../contexts/LoaderContext';
import { useToast } from '../../hooks/useToast';

const TimeTracking = () => {
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [currentBreak, setCurrentBreak] = useState(null);
  const [loading, setLoading] = useState(false);
  const { show: showGlobalLoading, hide: hideGlobalLoading } = useLoading();
  const { success, error: showError } = useToast();
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('Office');

  // Fetch today's status
  const fetchTodayStatus = async () => {
    try {
      const response = await apiClient.get('/api/employee/attendance/today-status');
      setTodayStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  };

  // Fetch attendance history
  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const response = await apiClient.get('/api/employee/attendance', {
        params: {
          start_date: startOfMonth.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
          limit: 30
        }
      });

      setAttendanceHistory(response.data.data?.records || []);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchTodayStatus();
        await fetchAttendanceHistory();
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadData();
  }, []);

  // Clock In
  const handleClockIn = async () => {
    console.log('🟢 Clock In started');
    try {
      console.log('🟢 Show loading');
      showGlobalLoading();
      
      const response = await apiClient.post('/api/employee/attendance/clock-in', {
        location,
        notes
      });
      
      console.log('🟢 Response received:', response);

      if (response.data.success) {
        await fetchTodayStatus();
        setNotes('');
        // Show success message
        success('Clocked in successfully!');
      }
    } catch (error) {
      console.error('🔴 Error clocking in:', error);
      showError(error.response?.data?.message || 'Failed to clock in');
    } finally {
      console.log('🟢 Hide loading');
      hideGlobalLoading();
    }
  };

  // Clock Out
  const handleClockOut = async () => {
    try {
      console.log('🔴 Clock Out started');
      showGlobalLoading();
      const response = await apiClient.post('/api/employee/attendance/clock-out', {
        notes
      });

      if (response.data.success) {
        await fetchTodayStatus();
        await fetchAttendanceHistory();
        setNotes('');
        // Show success message
        success('Clocked out successfully!');
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      showError(error.response?.data?.message || 'Failed to clock out');
    } finally {
      hideGlobalLoading();
    }
  };

  // Start Break
  const handleStartBreak = async () => {
    try {
      showGlobalLoading();
      const response = await apiClient.post('/api/employee/attendance/break/start', {
        notes
      });

      if (response.data.success) {
        await fetchTodayStatus();
        setCurrentBreak({ start: new Date(), notes });
        setNotes('');
        success('Break started!');
      }
    } catch (error) {
      console.error('Error starting break:', error);
      showError(error.response?.data?.message || 'Failed to start break');
    } finally {
      hideGlobalLoading();
    }
  };

  // End Break
  const handleEndBreak = async () => {
    try {
      showGlobalLoading();
      const response = await apiClient.post('/api/employee/attendance/break/end', {
        notes
      });

      if (response.data.success) {
        await fetchTodayStatus();
        setCurrentBreak(null);
        setNotes('');
        success('Break ended!');
      }
    } catch (error) {
      console.error('Error ending break:', error);
      showError(error.response?.data?.message || 'Failed to end break');
    } finally {
      hideGlobalLoading();
    }
  };

  // Format time
  const formatTime = (timeString) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Calculate duration
  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return '0h 0m';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Calculate weekly stats
  const calculateWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekAttendance = attendanceHistory.filter(record => 
      new Date(record.date) >= oneWeekAgo
    );

    const totalHours = weekAttendance.reduce((sum, record) => 
      sum + (record.total_hours || 0), 0
    );
    
    const totalOvertime = weekAttendance.reduce((sum, record) => 
      sum + (record.overtime || 0), 0
    );

    const presentDays = weekAttendance.filter(record => 
      record.status === 'present' || record.status === 'late'
    ).length;

    return {
      totalHours: totalHours.toFixed(1),
      totalOvertime: totalOvertime.toFixed(1),
      presentDays,
      totalDays: weekAttendance.length
    };
  };

  const weeklyStats = calculateWeeklyStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600 mt-1">Track your work hours and breaks</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-500">Current Time</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </p>
        </div>
      </div>

      {/* Main Time Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Clock In/Out */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Time Tracking</h2>
            
            {todayStatus ? (
              <div className="space-y-4">
                {/* Current Status */}
                <div className={`p-4 rounded-lg ${
                  todayStatus.clocked_in ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Current Status</p>
                      <p className={`text-lg font-bold ${
                        todayStatus.clocked_in ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {todayStatus.clocked_in ? 'Clocked In' : 'Not Clocked In'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      todayStatus.clocked_in ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Clock size={24} className={todayStatus.clocked_in ? 'text-green-600' : 'text-gray-400'} />
                    </div>
                  </div>
                </div>

                {/* Time Details */}
                {todayStatus.check_in_time && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Check In</p>
                      <p className="font-semibold text-blue-600">
                        {formatTime(todayStatus.check_in_time)}
                      </p>
                    </div>
                    
                    {todayStatus.check_out_time && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Check Out</p>
                        <p className="font-semibold text-orange-600">
                          {formatTime(todayStatus.check_out_time)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Shift */}
                {todayStatus.current_shift && (
                  <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
                    <p className="text-sm font-medium text-gray-600 mb-2">Current Shift</p>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-sky-600" />
                      <span className="font-medium text-sky-900">
                        {formatTime(todayStatus.current_shift.start_date_time)} - 
                        {formatTime(todayStatus.current_shift.end_date_time)}
                      </span>
                    </div>
                    {todayStatus.current_shift.title && (
                      <p className="text-sm text-gray-700 mt-1">{todayStatus.current_shift.title}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No attendance data for today</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {!todayStatus?.clocked_in ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <Button 
                    variant="primary"
                    className="w-full"
                    onClick={handleClockIn}
                    disabled={loading}
                  >
                    <Play size={16} />
                    Clock In
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Notes for clock out (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Button 
                    variant="secondary"
                    className="w-full"
                    onClick={handleClockOut}
                    disabled={loading}
                  >
                    <LogOut size={16} />
                    Clock Out
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Break Management */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Break Management</h2>
            
            {todayStatus?.clocked_in ? (
              <div className="space-y-4">
                {!currentBreak ? (
                  <div className="text-center py-6">
                    <Coffee size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-4">No active break</p>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Break notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={handleStartBreak}
                        disabled={loading}
                      >
                        <Coffee size={16} />
                        Start Break
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Break Started</p>
                        <p className="font-semibold text-yellow-600">
                          {formatTime(currentBreak.start)}
                        </p>
                      </div>
                      <Coffee size={24} className="text-yellow-600" />
                    </div>
                    
                    <div className="text-center mb-3">
                      <p className="text-2xl font-bold text-yellow-700">
                        {calculateDuration(currentBreak.start)}
                      </p>
                      <p className="text-sm text-gray-600">Break Duration</p>
                    </div>
                    
                    <Button 
                      variant="primary"
                      className="w-full"
                      onClick={handleEndBreak}
                      disabled={loading}
                    >
                      <Pause size={16} />
                      End Break
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Coffee size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Clock in first to manage breaks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600">{weeklyStats.totalHours}h</p>
            </div>
            <Clock size={24} className="text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overtime</p>
              <p className="text-2xl font-bold text-orange-600">{weeklyStats.totalOvertime}h</p>
            </div>
            <TrendingUp size={24} className="text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Present Days</p>
              <p className="text-2xl font-bold text-green-600">{weeklyStats.presentDays}</p>
            </div>
            <Calendar size={24} className="text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-600">{weeklyStats.totalDays}</p>
            </div>
            <Calendar size={24} className="text-gray-600" />
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h2>
        
        {attendanceHistory.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Check In</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Check Out</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total Hours</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record) => (
                  <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-3 px-4">
                      {record.check_in ? formatTime(record.check_in) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {record.check_out ? formatTime(record.check_out) : '-'}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {record.total_hours ? `${record.total_hours}h` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
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

export default TimeTracking;