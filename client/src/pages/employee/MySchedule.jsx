import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Button from '../../utils/Button';
import apiClient from '../../api/apiClient';
import { useLoading } from '../../contexts/LoaderContext';
import CalendarModal from '../../components/CalendarModal';

const MySchedule = () => {
  const [shifts, setShifts] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { show: showGlobalLoading, hide: hideGlobalLoading } = useLoading();

  // Fetch shifts for current week
  const fetchShifts = useCallback(async () => {
    try {
      showGlobalLoading();
      const startOfWeek = new Date(currentWeek);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const response = await apiClient.get('/api/employee/shifts', {
        params: {
          start_date: startOfWeek.toISOString().split('T')[0],
          end_date: endOfWeek.toISOString().split('T')[0]
        }
      });

      setShifts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      hideGlobalLoading();
    }
  }, [currentWeek, showGlobalLoading, hideGlobalLoading]);

  // Fetch today's status
  const fetchTodayStatus = async () => {
    try {
      const response = await apiClient.get('/api/employee/attendance/today-status');
      setTodayStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchShifts();
        await fetchTodayStatus();
      } catch (error) {
        console.error('Error loading schedule data:', error);
      }
    };
    
    loadData();
  }, [currentWeek]);

  // Navigate weeks
  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  // Get week dates
  const getWeekDates = () => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  // Get shifts for specific date
  const getShiftsForDate = (date) => {
    // Use local date instead of UTC to avoid timezone issues
    const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_date_time);
      const shiftDateStr = shiftDate.toLocaleDateString('en-CA');
      return shiftDateStr === dateStr;
    });
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const weekDates = getWeekDates();

  return (
    <>
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600 mt-1">Manage your work shifts and schedule</p>
        </div>
        
        {todayStatus && (
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="text-right">
              <p className="text-sm text-gray-500">Today's Status</p>
              <p className={`font-semibold ${
                todayStatus.clocked_in ? 'text-green-600' : 'text-gray-600'
              }`}>
                {todayStatus.clocked_in ? 'Clocked In' : 'Not Clocked In'}
              </p>
            </div>
            {todayStatus.check_in_time && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Check In Time</p>
                <p className="font-semibold text-gray-900">
                  {formatTime(todayStatus.check_in_time)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white rounded-lg shadow-sm p-4 gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigateWeek('prev')}
          className="order-1 sm:order-none"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous Week</span>
          <span className="sm:hidden">Prev</span>
        </Button>
        
        <div className="text-center order-2 sm:order-1">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h2>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigateWeek('next')}
          className="order-3 sm:order-0"
        >
          <span className="hidden sm:inline">Next Week</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dayShifts = getShiftsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNumber = date.getDate();

          return (
            <div 
              key={index}
              className={`bg-white rounded-lg shadow-sm border ${
                isToday ? 'border-sky-500 border-2' : 'border-gray-200'
              } min-h-[200px]`}
            >
              {/* Day Header */}
              <div className={`p-3 border-b ${
                isToday ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-center">
                  <p className={`text-sm font-medium ${
                    isToday ? 'text-sky-700' : 'text-gray-600'
                  }`}>
                    {dayName}
                  </p>
                  <p className={`text-lg font-bold ${
                    isToday ? 'text-sky-900' : 'text-gray-900'
                  }`}>
                    {dayNumber}
                  </p>
                  {isToday && (
                    <p className="text-xs text-sky-600 font-medium">Today</p>
                  )}
                </div>
              </div>

              {/* Shifts for the day */}
              <div className="p-2 space-y-2">
                {dayShifts.length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar size={24} className="mx-auto text-gray-300 mb-1" />
                    <p className="text-xs text-gray-500">No shifts</p>
                  </div>
                ) : (
                  dayShifts.map((shift) => (
                    <div 
                      key={shift._id}
                      className="bg-gray-50 rounded-lg p-2 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(shift.status)}`}>
                          {shift.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-500" />
                          <span className="text-xs font-medium text-gray-900">
                            {formatTime(shift.start_date_time)} - {formatTime(shift.end_date_time)}
                          </span>
                        </div>
                        
                        {shift.title && (
                          <div className="text-xs text-gray-700 font-medium truncate">
                            {shift.title}
                          </div>
                        )}
                        
                        {shift.location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-500" />
                            <span className="text-xs text-gray-600 truncate">
                              {shift.location}
                            </span>
                          </div>
                        )}
                        
                        {shift.shift_type && shift.shift_type !== 'regular' && (
                          <div className="text-xs text-sky-600 font-medium">
                            {shift.shift_type.replace('_', ' ').toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button 
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.href = '/time-tracking'}
          >
            <Clock size={16} />
            Clock In/Out
          </Button>
          
          <Button 
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.href = '/time-off'}
          >
            <Plus size={16} />
            Request Time Off
          </Button>
          
          <Button 
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowCalendarView(true)}
          >
            <Calendar size={16} />
            Calendar View
          </Button>
        </div>
      </div>

      {/* Upcoming Shifts Summary */}
      {shifts.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{shifts.length}</p>
              <p className="text-sm text-gray-600">Total Shifts</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {shifts.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {shifts.filter(s => s.status === 'scheduled').length}
              </p>
              <p className="text-sm text-gray-600">Scheduled</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">
                {shifts.reduce((total, shift) => {
                  const start = new Date(shift.start_date_time);
                  const end = new Date(shift.end_date_time);
                  return total + (end - start) / (1000 * 60 * 60);
                }, 0).toFixed(1)}h
              </p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </div>
          </div>
        </div>
      )}
    </div>

      <CalendarModal 
        showCalendarView={showCalendarView}
        setShowCalendarView={setShowCalendarView}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        getShiftsForDate={getShiftsForDate}
        formatTime={formatTime}
        getStatusColor={getStatusColor}
      />
</>
  );
}
export default MySchedule;