import React from 'react';
import { Calendar, Clock, MapPin, Briefcase, FileText, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ShiftDetailsModal = ({ shift, onClose }) => {
  const { t, i18n } = useTranslation();

  if (!shift) return null;

  // تنسيق التاريخ والوقت
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString(i18n.language, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: i18n.language === 'en'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
              {shift.title || "Shift Details"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Calendar size={12} /> {formatDate(shift.start_date_time)}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize shadow-sm border ${getStatusColor(shift.status).replace('bg-', 'border-').replace('text-', 'text-')}`}>
              {shift.status.replace('_', ' ')}
            </span>
          </div>

          {/* Time */}
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 dark:text-blue-300 uppercase">
                Time
              </p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {formatTime(shift.start_date_time)} - {formatTime(shift.end_date_time)}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <MapPin size={16} />
                <span className="text-xs font-bold uppercase">Location</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {shift.location || "Remote/Office"}
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Briefcase size={16} />
                <span className="text-xs font-bold uppercase">Type</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {shift.shift_type || "Regular"}
              </p>
            </div>
          </div>

          {/* Notes / Description */}
          {shift.description && (
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                <FileText size={16} />
                <span className="text-xs font-bold uppercase">Description</span>
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
                <span className="text-xs font-bold uppercase">Notes</span>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed italic">
                "{shift.notes}"
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition font-medium shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftDetailsModal;