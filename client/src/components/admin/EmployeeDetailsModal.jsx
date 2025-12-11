import { useState, useEffect } from "react";
import { useLoading } from "../../contexts/LoaderContext";
import { employeesService } from "../../api/services/admin/employeesService";
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Building,
  Shield
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const EmployeeDetailsModal = ({ employee, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show: showLoader, hide: hideLoader } = useLoading();
  const { t } = useTranslation();

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employee._id]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      showLoader();
      const response = await employeesService.getEmployee(employee._id);
      setDetails(response.data.data);
    } catch (error) {
      toast.error(t("admins.employeeDetails.errors.fetchFailed"));
      console.error("Error:", error);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("s.employeeDetails.never");
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    return status === 'present' 
      ? t("admins.employeeDetails.attendance.present") 
      : t("admins.employeeDetails.attendance.absent");
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

  const { profile, statistics, upcoming_shifts, attendance_history } = details || {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-12 h-12 rounded-full" />
                ) : (
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {profile?.name?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">{profile?.name}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="flex flex-wrap gap-2">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              profile?.is_active 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' 
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600'
            }`}>
              {profile?.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {profile?.is_active ? t("admins.employeeDetails.status.active") : t("admins.employeeDetails.status.inactive")}
            </div>
            
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-full text-xs font-medium">
              <Briefcase size={12} />
              {profile?.position}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto flex-1 dark:bg-slate-800">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <User size={14} />
              {t("admins.employeeDetails.sections.basicInfo")}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Mail size={12} className="text-gray-400 dark:text-slate-500" />
                  <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                    {t("admins.employeeDetails.fields.email")}
                  </p>
                </div>
                <p className="text-sm text-gray-900 dark:text-slate-100">{profile?.email}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={12} className="text-gray-400 dark:text-slate-500" />
                  <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                    {t("admins.employeeDetails.fields.phone")}
                  </p>
                </div>
                <p className="text-sm text-gray-900 dark:text-slate-100">
                  {profile?.phone || t("admins.employeeDetails.notProvided")}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase size={12} className="text-gray-400 dark:text-slate-500" />
                  <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                    {t("admins.employeeDetails.fields.position")}
                  </p>
                </div>
                <p className="text-sm text-gray-900 dark:text-slate-100">{profile?.position}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building size={12} className="text-gray-400 dark:text-slate-500" />
                  <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                    {t("admins.employeeDetails.fields.branchId")}
                  </p>
                </div>
                <p className="text-sm text-gray-900 dark:text-slate-100 truncate">{employee.branch_admin_id}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 size={14} />
              {t("admins.employeeDetails.sections.statistics")}
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-blue-100 dark:to-blue-900/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">
                      {t("admins.employeeDetails.stats.totalShifts")}
                    </p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{statistics?.total_shifts || 0}</p>
                  </div>
                  <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 dark:from-emerald-900/20 to-emerald-100 dark:to-emerald-900/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                      {t("admins.employeeDetails.stats.upcomingShifts")}
                    </p>
                    <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300">{upcoming_shifts?.length || 0}</p>
                  </div>
                  <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Shield size={14} />
              {t("admins.employeeDetails.sections.accountInfo")}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                  {t("admins.employeeDetails.account.memberSince")}
                </p>
                <p className="text-sm text-gray-900 dark:text-slate-100">{formatDate(profile?.createdAt)}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                  {t("admins.employeeDetails.account.lastLogin")}
                </p>
                <p className="text-sm text-gray-900 dark:text-slate-100">{formatDate(profile?.lastLogin)}</p>
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Clock size={14} />
                {t("admins.employeeDetails.sections.recentAttendance")}
              </h3>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {attendance_history?.length || 0} {t("admins.employeeDetails.records")}
              </span>
            </div>
            
            {attendance_history?.length > 0 ? (
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-slate-600">
                        <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-slate-300">
                          {t("admins.employeeDetails.table.date")}
                        </th>
                        <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-slate-300">
                          {t("admins.employeeDetails.table.status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance_history.slice(0, 5).map((record, index) => (
                        <tr key={index} className="border-t border-gray-200 dark:border-slate-600">
                          <td className="py-2 px-3">
                            {formatDate(record.date)}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              record.status === 'present' 
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {getStatusText(record.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <Clock size={24} className="text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {t("admins.employeeDetails.noAttendanceRecords")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 flex-shrink-0 dark:bg-slate-800">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm"
            >
              {t("admins.employeeDetails.closeButton")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;