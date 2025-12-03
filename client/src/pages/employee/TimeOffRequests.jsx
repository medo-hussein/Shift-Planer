import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Send, CheckCircle, XCircle, AlertCircle, Plus, Filter } from 'lucide-react';
import Button from '../../utils/Button';
import apiClient from '../../api/apiClient';
import { useLoading } from '../../contexts/LoaderContext';
import { useToast } from '../../hooks/useToast';

const TimeOffRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const { show: showGlobalLoading, hide: hideGlobalLoading } = useLoading();
  const { success, error } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: '',
    is_half_day: false
  });

  // Fetch leave requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/employee/leave-requests/me', {
        params: {
          status: filter === 'all' ? undefined : filter,
          page: 1,
          limit: 50
        }
      });

      setRequests(response.data.data || []);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      // Optional: error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [filter, fetchRequests]);

  // Handle Cancel Request
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?")) return;

    try {
      showGlobalLoading();
      // استدعاء الـ API لإلغاء الطلب (تأكد من وجود هذا المسار في الـ Backend)
      const response = await apiClient.patch(`/api/employee/leave-requests/${requestId}/cancel`);

      if (response.data.success) {
        success('Leave request cancelled successfully');
        // تحديث القائمة لإظهار الحالة الجديدة
        await fetchRequests();
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      error(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      hideGlobalLoading();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      error('Please fill all required fields');
      return;
    }

    try {
      showGlobalLoading();
      const response = await apiClient.post('/api/employee/leave-requests', {
        ...formData,
        start_date: formData.start_date,
        end_date: formData.end_date
      });

      if (response.data.success) {
        // Reset form
        setFormData({
          leave_type: 'sick',
          start_date: '',
          end_date: '',
          reason: '',
          is_half_day: false
        });
        setShowForm(false);
        await fetchRequests();
        success('Leave request submitted successfully!');
      }
    } catch (err) {
      console.error('Error submitting leave request:', err);
      error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      hideGlobalLoading();
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Calculate leave duration
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  // Get leave type label
  const getLeaveTypeLabel = (type) => {
    switch (type) {
      case 'sick': return 'Sick Leave';
      case 'vacation': return 'Vacation';
      case 'personal': return 'Personal Leave';
      case 'maternity': return 'Maternity Leave';
      case 'paternity': return 'Paternity Leave';
      case 'emergency': return 'Emergency Leave';
      default: return type;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats
  const calculateStats = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;

    return { total, pending, approved, rejected };
  };

  const stats = calculateStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Off Requests</h1>
          <p className="text-gray-600 mt-1">Manage your leave requests and time off</p>
        </div>
        
        <Button 
          variant="primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Calendar size={24} className="text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock size={24} className="text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle size={24} className="text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle size={24} className="text-red-600" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === status 
                    ? 'bg-sky-100 text-sky-700 border border-sky-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Leave Requests</h2>
        
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">No leave requests found</p>
            <Button 
              variant="outline"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              Create Your First Request
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {getLeaveTypeLabel(request.leave_type)}
                      </span>
                      {request.is_half_day && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Half Day
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {formatDate(request.start_date)}
                          {request.start_date !== request.end_date && ` - ${formatDate(request.end_date)}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {calculateDuration(request.start_date, request.end_date)} day(s)
                        </span>
                      </div>
                    </div>
                    
                    {request.reason && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {request.reason}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Requested: {formatDate(request.createdAt)}</span>
                      {request.admin_notes && (
                        <span className="text-gray-700">
                          <strong>Note:</strong> {request.admin_notes}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {/* ✅ تم تفعيل زر الإلغاء هنا */}
                    {request.status === 'pending' && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(request._id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">New Leave Request</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Type *
                  </label>
                  <select
                    name="leave_type"
                    value={formData.leave_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  >
                    <option value="sick">Sick Leave</option>
                    <option value="vacation">Vacation</option>
                    <option value="personal">Personal Leave</option>
                    <option value="emergency">Emergency Leave</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_half_day"
                    id="is_half_day"
                    checked={formData.is_half_day}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="is_half_day" className="text-sm text-gray-700">
                    Half Day Leave
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Please provide a reason for your leave request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={loading}
                  >
                    <Send size={16} />
                    Submit Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeOffRequests;