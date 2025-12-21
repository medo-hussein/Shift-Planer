import { useState, useEffect, useRef, useCallback } from "react";
import { employeesService } from "../../api/services/admin/employeesService";
import {
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Mail,
  Phone,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  UserCog,
  RefreshCw,
  Plus
} from "lucide-react";
import EmployeeModal from "../../components/admin/EmployeeModal";
import EmployeeDetailsModal from "../../components/admin/EmployeeDetailsModal";
import AttendanceModal from "../../components/admin/AttendanceModal";
import Swal from "sweetalert2";
import {Alert} from "../../utils/alertService.js" ;
import { useTranslation } from "react-i18next";
import DashboardSkeleton from "../../utils/DashboardSkeleton.jsx";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [positions, setPositions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const actionsMenuRef = useRef({});
  const { t } = useTranslation();

  // Fetch employees
  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);      
      const params = {
        page,
        limit: 10
      };
      const response = await employeesService.getEmployees(params);
      const rawData = response.data.data || [];
      
      const normalizedData = rawData.map(emp => ({
        ...emp,
        isActive: emp.isActive !== undefined ? emp.isActive : (emp.is_active !== undefined ? emp.is_active : true)
      }));

      setEmployees(normalizedData);
      setFilteredEmployees(normalizedData);
      setTotalPages(response.data.pagination?.total_pages || 1);
      setCurrentPage(response.data.pagination?.page || 1);
      
      const uniquePositions = [...new Set(normalizedData.map(emp => emp.position))];
      setPositions(uniquePositions);
      
    } catch (error) {
      Alert.error(t("admin.employees.errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...employees];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.phone?.includes(term) ||
        emp.position?.toLowerCase().includes(term)
      );
    }

    // Position Filter
    if (filterPosition !== "all") {
      filtered = filtered.filter(emp => emp.position === filterPosition);
    }

    if (filterStatus !== "all") {
      switch (filterStatus) {
        case "active":
          filtered = filtered.filter(emp => emp.isActive === true);
          break;
        case "inactive":
          filtered = filtered.filter(emp => emp.isActive === false);
          break;
        case "present":
          filtered = filtered.filter(emp => emp.stats?.today_status === "present");
          break;
        case "late":
          filtered = filtered.filter(emp => emp.stats?.today_status === "late");
          break;
        case "absent":
          filtered = filtered.filter(emp => emp.stats?.today_status === "absent");
          break;
        default:
          break;
      }
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, filterPosition, filterStatus]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.values(actionsMenuRef.current).forEach((ref) => {
        if (ref && !ref.contains(event.target)) {
          const employeeId = Object.keys(actionsMenuRef.current).find(
            key => actionsMenuRef.current[key] === ref
          );
          if (employeeId && showActionsMenu === employeeId) {
            setShowActionsMenu(null);
          }
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionsMenu]);

  // Handle search - with debounce
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    setSearchTimeout(
      setTimeout(() => {
        applyFilters();
      }, 300)
    );
  };

  // Handle create employee
  const handleCreateEmployee = async (employeeData) => {
    try {
      setLoading(true);
      await employeesService.createEmployee(employeeData);
      Alert.success(t("admin.employees.success.created"));
      setShowCreateModal(false);
      fetchEmployees(); 
    } catch (error) {
      const errorMsg = error.response?.data?.message || t("admin.employees.errors.createFailed");
      Alert.error(errorMsg);
      console.error("Create error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle update employee
  const handleUpdateEmployee = async (employeeId, data) => {
    try {
      setLoading(true);
      await employeesService.updateEmployee(employeeId, data);
      Alert.success(t("admin.employees.success.updated"));
      setShowCreateModal(false);
      setIsEditMode(false);
      setSelectedEmployee(null);
      fetchEmployees(currentPage); 
    } catch (error) {
      const errorMsg = error.response?.data?.message || t("admin.employees.errors.updateFailed");
      Alert.error(errorMsg);
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (employeeId, currentStatus, employeeName) => {
    const newStatus = !currentStatus;
    
    const result = await Swal.fire({
      title: "Change Status",
      text:` Are you sure you want to ${newStatus ?  "Activate" : "Deactivate"} ${employeeName}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#10b981' : '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: newStatus 
        ? t("admin.employees.statusChange.confirmActivate") 
        : t("admin.employees.statusChange.confirmDeactivate"),
      cancelButtonText: t("common.cancel"),
      reverseButtons: true,
    });
    
    if (result.isConfirmed) {
      try {
        setLoading(true);
        await employeesService.toggleEmployeeStatus(employeeId, { is_active: newStatus });
        
        setEmployees(prev => prev.map(emp => 
          emp._id === employeeId 
            ? { 
                ...emp, 
                isActive: newStatus,
                is_active: newStatus,
                stats: {
                  ...emp.stats,
                  today_status: newStatus ? (emp.stats?.today_status || "absent") : "absent"
                }
              }
            : emp
        ));
        
        applyFilters();
        Alert.success(` ${employeeName} ${newStatus ? "Activated" : "Deactivated"} Successfully`);
        
        setShowActionsMenu(null);
      } catch (error) {
        Alert.error(error.response?.data?.message || "  Change Status Failed");
        console.error("Toggle status error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async (employeeId, employeeName) => {
    const result = await Alert.confirm(`Are you sure you want to delete ${employeeName} ?`);
    
    if (result.isConfirmed) {
      try {
        setLoading(true);
        await employeesService.deleteEmployee(employeeId);
        setEmployees(prev => prev.filter(emp => emp._id !== employeeId));
        Alert.success(`${employeeName} Deleted Successfully`);
        applyFilters();
        
      } catch (error) {
        Alert.error(error.response?.data?.message || "Delete Failed");
      } finally {
        setLoading(false);
      }
    }
    setShowActionsMenu(null);
  };

  // Helpers & Modal Handlers
  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsEditMode(true);
    setShowCreateModal(true);
    setShowActionsMenu(null);
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
    setShowActionsMenu(null);
  };

  const handleViewAttendance = (employee) => {
    setSelectedEmployee(employee);
    setShowAttendanceModal(true);
    setShowActionsMenu(null);
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      fetchEmployees(page);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("admin.employees.notAvailable");
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t("admin.employees.invalidDate");
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (employee) => {
    const isActive = employee.isActive; 
    const todayStatus = employee.stats?.today_status;
    
    if (!isActive) {
      return {
        text: t("admin.employees.status.inactive"),
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: <PauseCircle size={14} />,
        active: false
      };
    }
    
    switch (todayStatus) {
      case "present":
        return {
          text: t("admin.employees.status.present"),
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <CheckCircle size={14} />,
          active: true
        };
      case "late":
        return {
          text: t("admin.employees.status.late"),
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: <Clock size={14} />,
          active: true
        };
      case "absent":
        return {
          text: t("admin.employees.status.absent"),
          color: "bg-red-50 text-red-700 border-red-200",
          icon: <XCircle size={14} />,
          active: true
        };
      default:
        return {
          text: t("admin.employees.status.active"),
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <CheckCircle size={14} />,
          active: true
        };
    }
  };

  if(loading) return <DashboardSkeleton />

  return (
<div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-3 sm:p-4 lg:p-6 font-sans dark:text-slate-100">
  {/* Header */}
  <div className="mb-4 sm:mb-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="mb-3 sm:mb-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100">
          {t("admin.employees.title")}
        </h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1 text-xs sm:text-sm">
          {t("admin.employees.subtitle")}
        </p>
      </div>
      
      <button
        onClick={() => {
          setIsEditMode(false);
          setSelectedEmployee(null);
          setShowCreateModal(true);
        }}
        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm w-full sm:w-auto"
      >
        <UserPlus size={18} />
        <span>{t("admin.employees.addEmployee")}</span>
      </button>
    </div>

    {/* Stats Cards - Improved mobile responsiveness */}
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
              {t("admin.employees.stats.totalEmployees")}
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">
              {filteredEmployees.length}
            </p>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg shrink-0 ml-2">
            <Briefcase className="text-blue-600 dark:text-blue-400" size={18} />
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
              {t("admin.employees.stats.presentToday")}
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">
              {filteredEmployees.filter(e => e.stats?.today_status === "present" || e.stats?.today_status === "late").length}
            </p>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg shrink-0 ml-2">
            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={18} />
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
              {t("admin.employees.stats.absentToday")}
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">
              {filteredEmployees.filter(e => e.stats?.today_status === "absent").length}
            </p>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg shrink-0 ml-2">
            <XCircle className="text-red-600 dark:text-red-400" size={18} />
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
              {t("admin.employees.stats.totalShifts")}
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">
              {filteredEmployees.reduce((sum, emp) => sum + (emp.stats?.total_shifts || 0), 0)}
            </p>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg shrink-0 ml-2">
            <Clock className="text-purple-600 dark:text-purple-400" size={18} />
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Filters and Search */}
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6">
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Search */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder={t("admin.employees.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="appearance-none w-full sm:w-40 pl-3 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="all">{t("admin.employees.filters.allPositions")}</option>
            {positions.map((pos, index) => (
              <option key={index} value={pos}>{pos}</option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" size={14} />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none w-full sm:w-40 pl-3 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="all">{t("admin.employees.filters.allStatus")}</option>
            <option value="active">{t("admin.employees.filters.active")}</option>
            <option value="inactive">{t("admin.employees.filters.inactive")}</option>
            <option value="present">{t("admin.employees.filters.presentToday")}</option>
            <option value="late">{t("admin.employees.filters.lateToday")}</option>
            <option value="absent">{t("admin.employees.filters.absentToday")}</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" size={14} />
        </div>

        <button
          onClick={() => {
            setSearchTerm("");
            setFilterPosition("all");
            setFilterStatus("all");
            fetchEmployees(1);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2 text-sm dark:text-slate-100"
        >
          <RefreshCw size={14} />
          {t("admin.employees.resetFilters")}
        </button>
      </div>
    </div>
  </div>

  {/* Employees Table */}
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
    {loading ? (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    ) : (
      <>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap">
                  {t("admin.employees.table.employee")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap hidden sm:table-cell">
                  {t("admin.employees.table.position")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap hidden lg:table-cell">
                  {t("admin.employees.table.contact")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap">
                  {t("admin.employees.table.status")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap hidden md:table-cell">
                  {t("admin.employees.table.shifts")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap hidden md:table-cell">
                  {t("admin.employees.table.joined")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap">
                  {t("admin.employees.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredEmployees.map((employee) => {
                const status = getStatusBadge(employee);
                return (
                  <tr key={employee._id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                          {employee.avatar ? (
                            <img src={employee.avatar} alt={employee.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                              {employee.name?.charAt(0) || "E"}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-slate-100 text-sm truncate">{employee.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate hidden sm:block">{employee.email}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate sm:hidden">{employee.position}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs whitespace-nowrap">
                        <Briefcase size={12} />
                        <span className="truncate">{employee.position}</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                          <Phone size={12} />
                          <span className="truncate">{employee.phone || t("admin.employees.notProvided")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                          <Mail size={12} />
                          <span className="truncate">{employee.email}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${status.color} whitespace-nowrap`}>
                        {status.icon}
                        <span className="font-medium truncate">{status.text}</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {employee.stats?.total_shifts || 0} {t("admin.employees.shifts")}
                        </div>
                        <div className={`text-xs ${employee.stats?.clocked_in_today ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'}`}>
                          {employee.stats?.clocked_in_today 
                            ? t("admin.employees.clockedIn") 
                            : t("admin.employees.notClockedIn")
                          }
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="text-xs text-gray-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(employee.createdAt)}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="relative" ref={el => actionsMenuRef.current[employee._id] = el}>
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === employee._id ? null : employee._id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          aria-label="Actions"
                        >
                          <MoreVertical size={18} className="text-gray-500 dark:text-slate-400" />
                        </button>
                        
                        {showActionsMenu === employee._id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50">
                            <button
                              onClick={() => handleViewDetails(employee)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 text-left"
                            >
                              <Eye size={14} />
                              {t("admin.employees.actions.viewDetails")}
                            </button>
                            
                            <button
                              onClick={() => handleViewAttendance(employee)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 text-left"
                            >
                              <BarChart3 size={14} />
                              {t("admin.employees.actions.viewAttendance")}
                            </button>
                            
                            <button
                              onClick={() => handleEdit(employee)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 text-left"
                            >
                              <Edit2 size={14} />
                              {t("admin.employees.actions.edit")}
                            </button>
                            
                            <button
                              onClick={() => handleToggleStatus(
                                employee._id, 
                                employee.isActive,
                                employee.name
                              )}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 text-left"
                            >
                              <UserCog size={14} />
                              {employee.isActive 
                                ? t("admin.employees.actions.deactivate") 
                                : t("admin.employees.actions.activate")
                              }
                            </button>
                            
                            <div className="border-t border-gray-200 dark:border-slate-600">
                              <button 
                                onClick={() => handleDeleteEmployee(employee._id, employee.name)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                              >
                                <Trash2 size={14} />
                                {t("admin.employees.actions.delete")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredEmployees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="text-gray-400 dark:text-slate-500" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
              {t("admin.employees.noEmployees")}
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-center mb-6 max-w-md text-sm">
              {searchTerm || filterPosition !== "all" || filterStatus !== "all" 
                ? t("admin.employees.tryAdjusting")
                : t("admin.employees.getStarted")
              }
            </p>
            <button
              onClick={() => {
                setIsEditMode(false);
                setSelectedEmployee(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus size={16} />
              {t("admin.employees.addEmployee")}
            </button>
          </div>
        )}

        {/* Pagination */}
        {filteredEmployees.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 px-4 py-4">
            <div className="text-sm text-gray-700 dark:text-slate-400">
              {t("admin.employees.pageOf", { page: currentPage, totalPages })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </>
    )}
  </div>

  {/* Modals */}
  {showCreateModal && (
    <EmployeeModal
      employee={isEditMode ? selectedEmployee : null}
      onClose={() => {
        setShowCreateModal(false);
        setSelectedEmployee(null);
        setIsEditMode(false);
      }}
      onSubmit={isEditMode ? 
        (data) => handleUpdateEmployee(selectedEmployee._id, data) : 
        handleCreateEmployee}
    />
  )}

  {showDetailsModal && selectedEmployee && (
    <EmployeeDetailsModal
      employee={selectedEmployee}
      onClose={() => {
        setShowDetailsModal(false);
        setSelectedEmployee(null);
      }}
    />
  )}

  {showAttendanceModal && selectedEmployee && (
    <AttendanceModal
      employee={selectedEmployee}
      onClose={() => {
        setShowAttendanceModal(false);
        setSelectedEmployee(null);
      }}
    />
  )}
</div>
  );
};

export default Employees;