import { useState, useEffect } from "react";
import { useLoading } from "../../contexts/LoaderContext";
import { employeesService } from "../../api/services/admin/employeesService";
import {
  X,
  Clock,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-hot-toast";

const AttendanceModal = ({ employee, onClose }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show: showLoader, hide: hideLoader } = useLoading();

  useEffect(() => {
    fetchAttendance();
  }, [employee._id]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      showLoader();
      const response = await employeesService.getEmployeeAttendance(employee._id);
      setAttendanceData(response.data);
    } catch (error) {
      toast.error("Failed to fetch attendance data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";

    const date = new Date(timeString);

    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const { employee: empInfo, records, total, total_hours, total_overtime } = attendanceData || {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Clock className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Attendance History</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">{empInfo?.name} • {empInfo?.position}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 dark:bg-slate-800">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Total Records</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-300">{total || 0}</p>
                </div>
                <Clock className="text-blue-600 dark:text-blue-400" size={18} />
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Total Hours</p>
                  <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300">{total_hours || 0}</p>
                </div>
                <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={18} />
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Overtime</p>
                  <p className="text-xl font-bold text-orange-900 dark:text-orange-300">{total_overtime || 0}</p>
                </div>
                <Clock className="text-orange-600 dark:text-orange-400" size={18} />
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-600">
                  <tr>
                    <th className="py-2 px-3 text-left font-semibold text-gray-900 dark:text-slate-100">Date</th>
                    <th className="py-2 px-3 text-left font-semibold text-gray-900 dark:text-slate-100">Clock In</th>
                    <th className="py-2 px-3 text-left font-semibold text-gray-900 dark:text-slate-100">Clock Out</th>
                    <th className="py-2 px-3 text-left font-semibold text-gray-900 dark:text-slate-100">Hours</th>
                    <th className="py-2 px-3 text-left font-semibold text-gray-900 dark:text-slate-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                  {records && records.length > 0 ? (
                    records.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-600">
                        <td className="py-2 px-3">
                          <div className="text-sm text-gray-900 dark:text-slate-100">
                            {formatDate(record.date)}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-sm text-gray-900 dark:text-slate-100">
                            {formatTime(record.check_in)}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-sm text-gray-900 dark:text-slate-100">
                            {formatTime(record.check_out)}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            {record.total_hours || '0'} hrs
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${record.status === 'present'
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : record.status === 'late'
                                ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                            {record.status === 'present' ? 'On Time' :
                              record.status === 'late' ? 'Late' :
                                record.status === 'absent' ? 'Absent' : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 px-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Clock size={32} className="text-gray-400 dark:text-slate-500 mb-2" />
                          <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1">No attendance records</h3>
                          <p className="text-gray-600 dark:text-slate-400 text-xs max-w-md">
                            No attendance records found for {empInfo?.name}.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 flex-shrink-0 dark:bg-slate-800">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;