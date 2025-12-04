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

const EmployeeDetailsModal = ({ employee, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { show: showLoader, hide: hideLoader } = useLoading();

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
      toast.error("Failed to fetch employee details");
      console.error("Error:", error);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const { profile, statistics, upcoming_shifts, attendance_history } = details || {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-12 h-12 rounded-full" />
                ) : (
                  <span className="text-lg font-bold text-blue-600">
                    {profile?.name?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{profile?.name}</h2>
                <p className="text-sm text-gray-600 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="flex flex-wrap gap-2">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              profile?.is_active 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              {profile?.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {profile?.is_active ? 'Active' : 'Inactive'}
            </div>
            
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
              <Briefcase size={12} />
              {profile?.position}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User size={14} />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Mail size={12} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-600">Email</p>
                </div>
                <p className="text-sm text-gray-900">{profile?.email}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={12} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-600">Phone</p>
                </div>
                <p className="text-sm text-gray-900">{profile?.phone || 'Not provided'}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase size={12} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-600">Position</p>
                </div>
                <p className="text-sm text-gray-900">{profile?.position}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building size={12} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-600">Branch ID</p>
                </div>
                <p className="text-sm text-gray-900 truncate">{employee.branch_admin_id}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 size={14} />
              Statistics
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Total Shifts</p>
                    <p className="text-lg font-bold text-blue-900">{statistics?.total_shifts || 0}</p>
                  </div>
                  <Clock size={16} className="text-blue-600" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700 mb-1">Upcoming Shifts</p>
                    <p className="text-lg font-bold text-emerald-900">{upcoming_shifts?.length || 0}</p>
                  </div>
                  <Calendar size={16} className="text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Shield size={14} />
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">Member Since</p>
                <p className="text-sm text-gray-900">{formatDate(profile?.createdAt)}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">Last Login</p>
                <p className="text-sm text-gray-900">{formatDate(profile?.lastLogin)}</p>
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={14} />
                Recent Attendance
              </h3>
              <span className="text-xs text-gray-500">
                {attendance_history?.length || 0} records
              </span>
            </div>
            
            {attendance_history?.length > 0 ? (
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-3 text-left font-medium text-gray-600">Date</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance_history.slice(0, 5).map((record, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-2 px-3">
                            {formatDate(record.date)}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              record.status === 'present' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : 'bg-red-50 text-red-700'
                            }`}>
                              {record.status === 'present' ? 'Present' : 'Absent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Clock size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No attendance records found</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;