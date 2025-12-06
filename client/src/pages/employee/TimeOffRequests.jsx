import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
} from "lucide-react";
import Button from "../../utils/Button";
import apiClient from "../../api/apiClient";
import { useLoading } from "../../contexts/LoaderContext";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";

const TimeOffRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const { show: showGlobalLoading, hide: hideGlobalLoading } = useLoading();
  const { success, error } = useToast();
  const { t, i18n } = useTranslation();

  // Form state
  const [formData, setFormData] = useState({
    leave_type: "sick",
    start_date: "",
    end_date: "",
    reason: "",
    is_half_day: false,
  });

  // Fetch leave requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/employee/leave-requests/me", {
        params: {
          status: filter === "all" ? undefined : filter,
          page: 1,
          limit: 50,
        },
      });

      setRequests(response.data.data || []);
    } catch (err) {
      console.error(t("timeOffRequests.errors.fetch"), err);
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    fetchRequests();
  }, [filter, fetchRequests]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.start_date || !formData.end_date || !formData.reason) {
      error(t("timeOffRequests.alerts.fillAllFields"));
      return;
    }

    try {
      showGlobalLoading();
      const response = await apiClient.post("/api/employee/leave-requests", {
        ...formData,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      if (response.data.success) {
        // Reset form
        setFormData({
          leave_type: "sick",
          start_date: "",
          end_date: "",
          reason: "",
          is_half_day: false,
        });
        setShowForm(false);
        await fetchRequests();
        success(t("timeOffRequests.alerts.submitSuccess"));
      }
    } catch (err) {
      console.error(t("timeOffRequests.errors.submit"), err);
      error(err.response?.data?.message || t("timeOffRequests.alerts.submitFailed"));
    } finally {
      hideGlobalLoading();
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle cancel request
  const handleCancelRequest = async (requestId) => {
    try {
      showGlobalLoading();
      await apiClient.patch(`/api/employee/leave-requests/${requestId}/cancel`);
      await fetchRequests();
      success(t("timeOffRequests.alerts.cancelSuccess"));
    } catch (error) {
      console.error(t("timeOffRequests.errors.cancel"), error);
      error(error.response?.data?.message || t("timeOffRequests.alerts.cancelFailed"));
    } finally {
      hideGlobalLoading();
    }
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
      case "approved":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "cancelled":
        return "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 border-gray-200 dark:border-slate-600";
      default:
        return "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 border-gray-200 dark:border-slate-600";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} />;
      case "rejected":
        return <XCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  // Get leave type label
  const getLeaveTypeLabel = (type) => {
    switch (type) {
      case "sick":
        return t("timeOffRequests.leaveTypes.sick");
      case "vacation":
        return t("timeOffRequests.leaveTypes.vacation");
      case "personal":
        return t("timeOffRequests.leaveTypes.personal");
      case "maternity":
        return t("timeOffRequests.leaveTypes.maternity");
      case "paternity":
        return t("timeOffRequests.leaveTypes.paternity");
      case "emergency":
        return t("timeOffRequests.leaveTypes.emergency");
      default:
        return type;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate stats
  const calculateStats = () => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;

    return { total, pending, approved, rejected };
  };

  const stats = calculateStats();

  const getStatusTranslation = (status) => {
    switch (status) {
      case "approved": return t("timeOffRequests.status.approved");
      case "rejected": return t("timeOffRequests.status.rejected");
      case "pending": return t("timeOffRequests.status.pending");
      case "cancelled": return t("timeOffRequests.status.cancelled");
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="p-4 sm:p-10 dark:bg-slate-900 dark:text-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">
            {t("timeOffRequests.title")}
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            {t("timeOffRequests.subtitle")}
          </p>
        </div>

        <Button
          variant="primary"
          className="flex items-center justify-center gap-4"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          {t("timeOffRequests.buttons.newRequest")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {t("timeOffRequests.stats.totalRequests")}
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total}
              </p>
            </div>
            <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {t("timeOffRequests.stats.pending")}
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pending}
              </p>
            </div>
            <Clock size={24} className="text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {t("timeOffRequests.stats.approved")}
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.approved}
              </p>
            </div>
            <CheckCircle
              size={24}
              className="text-green-600 dark:text-green-400"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {t("timeOffRequests.stats.rejected")}
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.rejected}
              </p>
            </div>
            <XCircle size={24} className="text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={20} className="text-gray-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {t("timeOffRequests.filter.label")}:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "approved", "rejected", "cancelled"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {getStatusTranslation(status)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
          {t("timeOffRequests.yourRequests")}
        </h2>

        {requests.length === 0 ? (
          <div className="text-center py-8">
            <Calendar
              size={48}
              className="mx-auto text-gray-300 dark:text-slate-600 mb-3"
            />
            <p className="text-gray-500 dark:text-slate-400 mb-4">
              {t("timeOffRequests.noRequests")}
            </p>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-4 mx-auto"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              {t("timeOffRequests.buttons.createFirstRequest")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow dark:bg-slate-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {getStatusTranslation(request.status)}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-50">
                        {getLeaveTypeLabel(request.leave_type)}
                      </span>
                      {request.is_half_day && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                          {t("timeOffRequests.halfDay")}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar
                          size={16}
                          className="text-gray-500 dark:text-slate-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300">
                          {formatDate(request.start_date)}
                          {request.start_date !== request.end_date &&
                            ` - ${formatDate(request.end_date)}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock
                          size={16}
                          className="text-gray-500 dark:text-slate-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300">
                          {calculateDuration(
                            request.start_date,
                            request.end_date
                          )}{" "}
                          {t("timeOffRequests.days")}
                        </span>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                        <strong>{t("timeOffRequests.reason")}:</strong> {request.reason}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-500">
                      <span>{t("timeOffRequests.requested")}: {formatDate(request.createdAt)}</span>
                      {request.admin_notes && (
                        <span className="text-gray-700 dark:text-slate-300">
                          <strong>{t("timeOffRequests.adminNote")}:</strong> {request.admin_notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {request.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(request._id)}
                      >
                        {t("timeOffRequests.buttons.cancel")}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
                  {t("timeOffRequests.modal.title")}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                  aria-label={t("timeOffRequests.modal.close")}
                >
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t("timeOffRequests.form.leaveType")} *
                  </label>
                  <select
                    name="leave_type"
                    value={formData.leave_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50"
                    required
                  >
                    <option value="sick">{t("timeOffRequests.leaveTypes.sick")}</option>
                    <option value="vacation">{t("timeOffRequests.leaveTypes.vacation")}</option>
                    <option value="personal">{t("timeOffRequests.leaveTypes.personal")}</option>
                    <option value="emergency">{t("timeOffRequests.leaveTypes.emergency")}</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_half_day"
                    id="is_half_day"
                    checked={formData.is_half_day}
                    onChange={handleInputChange}
                    className="mr-2 w-4 h-4 accent-sky-500 dark:accent-sky-400"
                  />
                  <label
                    htmlFor="is_half_day"
                    className="text-sm text-gray-700 dark:text-slate-300"
                  >
                    {t("timeOffRequests.form.halfDay")}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t("timeOffRequests.form.startDate")} *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t("timeOffRequests.form.endDate")} *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    min={
                      formData.start_date ||
                      new Date().toISOString().split("T")[0]
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t("timeOffRequests.form.reason")} *
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder={t("timeOffRequests.form.reasonPlaceholder")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400"
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
                    {t("timeOffRequests.buttons.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex items-center justify-center gap-4"
                    disabled={loading}
                  >
                    <Send size={16} />
                    {t("timeOffRequests.buttons.submitRequest")}
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