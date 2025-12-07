import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Plus, X, FileText, Briefcase, Info, ArrowRightLeft } from 'lucide-react';
import Button from '../../utils/Button';
import apiClient from '../../api/apiClient';
import { useLoading } from '../../contexts/LoaderContext';
import CalendarModal from '../../components/CalendarModal';
import SwapRequestModal from '../../components/employee/SwapRequestModal'; 
import { useTranslation } from 'react-i18next';
import { Alert } from '../../utils/alertService'; // ✅ 1. Import Alert Service

const ShiftDetailsModal = ({ shift, onClose, formatTime, getStatusColor, onSwapRequest }) => {
  const { t, i18n } = useTranslation();

  if (!shift) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusTranslation = (status) => {
    switch (status) {
      case 'scheduled': return t('mySchedule.status.scheduled');
      case 'in_progress': return t('mySchedule.status.inProgress');
      case 'completed': return t('mySchedule.status.completed');
      case 'cancelled': return t('mySchedule.status.cancelled');
      default: return status.replace('_', ' ');
    }
  };

  // Check if shift is in the future
  const isFutureShift = new Date(shift.start_date_time) > new Date();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn dark:bg-black/80">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
              {shift.title || t("mySchedule.shiftModal.defaultTitle")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Calendar size={12} /> {formatDate(shift.start_date_time)}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
            aria-label={t("mySchedule.modal.close")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize shadow-sm border ${getStatusColor(shift.status).replace('bg-', 'border-').replace('text-', 'text-')}`}>
              {getStatusTranslation(shift.status)}
            </span>
          </div>

          {/* Time */}
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 dark:text-blue-300 uppercase">
                {t("mySchedule.shiftModal.time")}
              </p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {formatTime(shift.start_date_time)} - {formatTime(shift.end_date_time)}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Location */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <MapPin size={16} />
                <span className="text-xs font-bold uppercase">{t("mySchedule.shiftModal.location")}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {shift.location || t("mySchedule.shiftModal.notSpecified")}
              </p>
            </div>

            {/* Type */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Briefcase size={16} />
                <span className="text-xs font-bold uppercase">{t("mySchedule.shiftModal.type")}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {shift.shift_type || t("mySchedule.shiftModal.regular")}
              </p>
            </div>
          </div>

          {/* Notes / Description */}
          {shift.description && (
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                <FileText size={16} />
                <span className="text-xs font-bold uppercase">{t("mySchedule.shiftModal.description")}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {shift.description}
              </p>
            </div>
          )}

           {/* Admin Notes */}
           {shift.notes && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl border border-yellow-100 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                <Info size={16} />
                <span className="text-xs font-bold uppercase">{t("mySchedule.shiftModal.notes")}</span>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed italic">
                "{shift.notes}"
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
          
          {/* Swap Button Logic */}
          {shift.status === 'scheduled' && isFutureShift && (
            <button 
              onClick={() => onSwapRequest(shift)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition font-medium shadow-md flex items-center gap-2"
            >
              <ArrowRightLeft size={16} />
              Request Swap
            </button>
          )}

          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition font-medium shadow-md"
          >
            {t("mySchedule.buttons.close")}
          </button>
        </div>

      </div>
    </div>
  );
};

const MySchedule = () => {
  const [shifts, setShifts] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState(null);
  
  // Swap Modal State
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [shiftToSwap, setShiftToSwap] = useState(null);
  
  const { show: showGlobalLoading, hide: hideGlobalLoading } = useLoading();
  const { t, i18n } = useTranslation();

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
      console.error(error);
      Alert.error(t('mySchedule.errors.fetchShifts') || "Failed to load shifts"); // ✅ 2. Use Alert for error
    } finally {
      hideGlobalLoading();
    }
  }, [currentWeek, t]); // Removed showGlobalLoading/hideGlobalLoading to prevent loop

  // Fetch today's status
  const fetchTodayStatus = async () => {
    try {
      const response = await apiClient.get('/api/employee/attendance/today-status');
      setTodayStatus(response.data.data);
    } catch (error) {
      console.error(error);
      // Optional: Alert.error(t('mySchedule.errors.fetchTodayStatus')); 
      // Sometimes we don't want to alert on background fetch failures to not annoy the user
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchShifts();
        await fetchTodayStatus();
      } catch (error) {
        console.error(error);
        Alert.error(t('mySchedule.errors.loadData') || "Error loading schedule data"); // ✅ 3. Use Alert for error
      }
    };
    
    loadData();
  }, [currentWeek, fetchShifts, t]);

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
    return time.toLocaleTimeString(i18n.language, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: i18n.language === 'en'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getStatusTranslation = (status) => {
    switch (status) {
      case 'scheduled': return t('mySchedule.status.scheduled');
      case 'in_progress': return t('mySchedule.status.inProgress');
      case 'completed': return t('mySchedule.status.completed');
      case 'cancelled': return t('mySchedule.status.cancelled');
      default: return status.replace('_', ' ');
    }
  };

  // Handle Swap Click
  const handleSwapClick = (shift) => {
    setShiftToSwap(shift);
    setSelectedShift(null); // Close details modal
    setShowSwapModal(true); // Open swap modal
  };

  const weekDates = getWeekDates();

  return (
    <>
    <div className="p-4 sm:p-10 mx-auto dark:bg-slate-900 dark:text-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">{t("mySchedule.title")}</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">{t("mySchedule.subtitle")}</p>
        </div>
        
        {todayStatus && (
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-slate-400">{t("mySchedule.todayStatus")}</p>
              <p className={`font-semibold ${
                todayStatus.clocked_in ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'
              }`}>
                {todayStatus.clocked_in ? t("mySchedule.clockedIn") : t("mySchedule.notClockedIn")}
              </p>
            </div>
            {todayStatus.check_in_time && (
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-slate-400">{t("mySchedule.checkInTime")}</p>
                <p className="font-semibold text-gray-900 dark:text-slate-50">
                  {formatTime(todayStatus.check_in_time)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigateWeek('prev')}
          className="order-1 sm:order-0 flex items-center gap-1 py-4"
          aria-label={t("mySchedule.buttons.previousWeek")}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">{t("mySchedule.buttons.previousWeek")}</span>
          <span className="sm:hidden">{t("mySchedule.buttons.prev")}</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigateWeek('next')}
          className="order-3 sm:order-2 flex items-center gap-1 py-4"
          aria-label={t("mySchedule.buttons.nextWeek")}
        >
          <span className="hidden sm:inline">{t("mySchedule.buttons.nextWeek")}</span>
          <span className="sm:hidden">{t("mySchedule.buttons.next")}</span>
          <ChevronRight size={16} />
        </Button>

        <div className="text-center order-2 sm:order-1">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-50">
            {weekDates[0].toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })} - 
            {weekDates[6].toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
          </h2>
        </div>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dayShifts = getShiftsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const dayName = date.toLocaleDateString(i18n.language, { weekday: 'short' });
          const dayNumber = date.getDate();

          return (
            <div 
              key={index}
              className={`bg-white dark:bg-slate-900 rounded-lg shadow-sm border ${
                isToday ? 'border-sky-500 dark:border-sky-400 border-2' : 'border-gray-200 dark:border-slate-700'
              } min-h-[200px]`}
            >
              {/* Day Header */}
              <div className={`p-3 border-b ${
                isToday ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
              }`}>
                <div className="text-center">
                  <p className={`text-sm font-medium ${
                    isToday ? 'text-sky-700 dark:text-sky-300' : 'text-gray-600 dark:text-slate-400'
                  }`}>
                    {dayName}
                  </p>
                  <p className={`text-lg font-bold ${
                    isToday ? 'text-sky-900 dark:text-sky-100' : 'text-gray-900 dark:text-slate-50'
                  }`}>
                    {dayNumber}
                  </p>
                  {isToday && (
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                      {t("mySchedule.today")}
                    </p>
                  )}
                </div>
              </div>

              {/* Shifts for the day */}
              <div className="p-2 space-y-2">
                {dayShifts.length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar size={24} className="mx-auto text-gray-300 dark:text-slate-600 mb-1" />
                    <p className="text-xs text-gray-500 dark:text-slate-500">
                      {t("mySchedule.noShifts")}
                    </p>
                  </div>
                ) : (
                  dayShifts.map((shift) => (
                    <div 
                      key={shift._id}
                      onClick={() => setSelectedShift(shift)}
                      className="bg-gray-50 dark:bg-slate-800 rounded-lg p-2 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer hover:border-sky-300 dark:hover:border-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(shift.status)}`}>
                          {getStatusTranslation(shift.status)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-500 dark:text-slate-500" />
                          <span className="text-xs font-medium text-gray-900 dark:text-slate-200">
                            {formatTime(shift.start_date_time)} - {formatTime(shift.end_date_time)}
                          </span>
                        </div>
                        
                        {shift.title && (
                          <div className="text-xs text-gray-700 dark:text-slate-300 font-medium truncate">
                            {shift.title}
                          </div>
                        )}
                        
                        {shift.location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-500 dark:text-slate-500" />
                            <span className="text-xs text-gray-600 dark:text-slate-400 truncate">
                              {shift.location}
                            </span>
                          </div>
                        )}
                        
                        {shift.shift_type && shift.shift_type !== 'regular' && (
                          <div className="text-xs text-sky-600 dark:text-sky-400 font-medium uppercase">
                            {shift.shift_type.replace('_', ' ')}
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
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
          {t("mySchedule.quickActions.title")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button 
            variant="outline"
            className="w-full flex items-center justify-center gap-4"
            onClick={() => window.location.href = '/time-tracking'}
          >
            <Clock size={16} />
            {t("mySchedule.quickActions.clockInOut")}
          </Button>
          
          <Button 
            variant="outline"
            className="w-full flex items-center justify-center gap-4"
            onClick={() => window.location.href = '/time-off'}
          >
            <Plus size={16} />
            {t("mySchedule.quickActions.requestTimeOff")}
          </Button>
          
          <Button 
            variant="outline"
            className="w-full flex items-center justify-center gap-4"
            onClick={() => setShowCalendarView(true)}
          >
            <Calendar size={16} />
            {t("mySchedule.quickActions.calendarView")}
          </Button>
        </div>
      </div>

      {/* Upcoming Shifts Summary */}
      {shifts.length > 0 && (
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
            {t("mySchedule.weeklySummary.title")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{shifts.length}</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">{t("mySchedule.weeklySummary.totalShifts")}</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {shifts.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-400">{t("mySchedule.weeklySummary.completed")}</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {shifts.filter(s => s.status === 'scheduled').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-400">{t("mySchedule.weeklySummary.scheduled")}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-600 dark:text-slate-300">
                {shifts.reduce((total, shift) => {
                  const start = new Date(shift.start_date_time);
                  const end = new Date(shift.end_date_time);
                  return total + (end - start) / (1000 * 60 * 60);
                }, 0).toFixed(1)}h
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-400">{t("mySchedule.weeklySummary.totalHours")}</p>
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

      {/* Render Details Modal */}
      {selectedShift && (
        <ShiftDetailsModal 
          shift={selectedShift} 
          onClose={() => setSelectedShift(null)} 
          formatTime={formatTime}
          getStatusColor={getStatusColor}
          onSwapRequest={handleSwapClick}
        />
      )}

      {/* Render Swap Modal */}
      {showSwapModal && shiftToSwap && (
        <SwapRequestModal 
            shift={shiftToSwap} 
            onClose={() => setShowSwapModal(false)}
            onSuccess={() => {
                fetchShifts();
                setShiftToSwap(null);
            }}
        />
      )}
</>
  );
}
export default MySchedule;