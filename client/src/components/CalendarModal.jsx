import React from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Button from '../utils/Button';

const CalendarModal = ({
    showCalendarView,
    setShowCalendarView,
    selectedMonth,
    setSelectedMonth,
    getShiftsForDate,
    formatTime,
    getStatusColor
}) => {
    // Get calendar days for month view
    const getCalendarDays = () => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Start from Sunday of the first week
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // End on Saturday of the last week
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

        const days = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            days.push({
                date: new Date(current),
                isCurrentMonth: current.getMonth() === month
            });
            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    if (!showCalendarView) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Calendar View</h2>
                    <button
                        onClick={() => setShowCalendarView(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between p-4 bg-gray-50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const newMonth = new Date(selectedMonth);
                            newMonth.setMonth(newMonth.getMonth() - 1);
                            setSelectedMonth(newMonth);
                        }}
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </Button>

                    <h3 className="text-lg font-semibold text-gray-900">
                        {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const newMonth = new Date(selectedMonth);
                            newMonth.setMonth(newMonth.getMonth() + 1);
                            setSelectedMonth(newMonth);
                        }}
                    >
                        Next
                        <ChevronRight size={16} />
                    </Button>
                </div>

                {/* Calendar Grid */}
                <div className="p-6">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {getCalendarDays().map((day, index) => {
                            const dayShifts = getShiftsForDate(day.date);
                            const isToday = day.date.toDateString() === new Date().toDateString();
                            const isCurrentMonth = day.date.getMonth() === selectedMonth.getMonth();

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[100px] p-2 border rounded-lg ${isToday ? 'border-sky-500 bg-sky-50' :
                                            isCurrentMonth ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-sm font-medium ${isToday ? 'text-sky-700' :
                                                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                            }`}>
                                            {day.date.getDate()}
                                        </span>
                                        {isToday && (
                                            <span className="text-xs text-sky-600 font-medium">Today</span>
                                        )}
                                    </div>

                                    {/* Shifts for the day */}
                                    <div className="space-y-1">
                                        {dayShifts.slice(0, 2).map(shift => (
                                            <div
                                                key={shift._id}
                                                className={`text-xs p-1 rounded truncate ${getStatusColor(shift.status)}`}
                                                title={`${shift.title || 'Shift'} - ${formatTime(shift.start_date_time)} - ${formatTime(shift.end_date_time)}${shift.location ? ` at ${shift.location}` : ''}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">
                                                        {formatTime(shift.start_date_time)}
                                                    </span>
                                                    {shift.title && (
                                                        <span className="text-gray-600">
                                                            - {shift.title}
                                                        </span>
                                                    )}
                                                </div>
                                                {shift.location && (
                                                    <div className="flex items-center gap-1 text-gray-500 truncate">
                                                        <MapPin size={10} />
                                                        {shift.location}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {dayShifts.length > 2 && (
                                            <div className="text-xs text-gray-500 text-center">
                                                +{dayShifts.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-100 rounded"></div>
                            <span className="text-gray-600">Scheduled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-100 rounded"></div>
                            <span className="text-gray-600">In Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-100 rounded"></div>
                            <span className="text-gray-600">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-100 rounded"></div>
                            <span className="text-gray-600">Cancelled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarModal;
