import { useState, useEffect, useRef, useCallback } from "react";
import { useLoading } from "../../contexts/LoaderContext";
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
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import {Alert} from "../../utils/alertService.js" ;

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
  const { show: showLoader, hide: hideLoader } = useLoading();
  const actionsMenuRef = useRef({});

  // Fetch employees
  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      showLoader();
      
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
      Alert.error("Failed to fetch employees");
    } finally {
      setLoading(false);
      hideLoader();
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
      showLoader();
      await employeesService.createEmployee(employeeData);
      Alert.success("Employee created successfully");
      setShowCreateModal(false);
      fetchEmployees(); 
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to create employee";
      Alert.error(errorMsg);
      console.error("Create error:", error);
    } finally {
      hideLoader();
    }
  };

  // Handle update employee
  const handleUpdateEmployee = async (employeeId, data) => {
    try {
      showLoader();
      await employeesService.updateEmployee(employeeId, data);
      Alert.success("Employee updated successfully");
      setShowCreateModal(false);
      setIsEditMode(false);
      setSelectedEmployee(null);
      fetchEmployees(currentPage); 
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update employee";
      Alert.error(errorMsg);
      console.error("Update error:", error);
    } finally {
      hideLoader();
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (employeeId, currentStatus, employeeName) => {
    const newStatus = !currentStatus;
    
    const result = await Swal.fire({
      title: 'Change Status',
      text: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${employeeName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#10b981' : '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: newStatus ? 'Yes, activate' : 'Yes, deactivate',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    
    if (result.isConfirmed) {
      try {
        showLoader();
        
        await employeesService.toggleEmployeeStatus(employeeId, { is_active: newStatus });
        
        setEmployees(prev => prev.map(emp => 
          emp._id === employeeId 
            ? { 
                ...emp, 
                isActive: newStatus, // UI uses this
                is_active: newStatus, // Sync backup
                stats: {
                  ...emp.stats,
                  today_status: newStatus ? (emp.stats?.today_status || "absent") : "absent"
                }
              }
            : emp
        ));
        
        applyFilters();
        Alert.success(`Employee "${employeeName}" ${newStatus ? 'activated' : 'deactivated'} successfully`);
        
        setShowActionsMenu(null);
      } catch (error) {
        Alert.error(error.response?.data?.message || 'Failed to update employee status');
        console.error("Toggle status error:", error);
      } finally {
        hideLoader();
      }
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async (employeeId, employeeName) => {
    const result = await Alert.confirm(`You are about to delete "${employeeName}". This action cannot be undone!`);
    
    if (result.isConfirmed) {
      try {
        showLoader();
        await employeesService.deleteEmployee(employeeId);
        setEmployees(prev => prev.filter(emp => emp._id !== employeeId));
        Alert.success(`Employee "${employeeName}" has been deleted successfully`);
        applyFilters();
        
      } catch (error) {
        Alert.error(error.response?.data?.message || 'Failed to delete employee');
      } finally {
        hideLoader();
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
    if (!dateString) return "Not Available";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
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
        text: "Inactive",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: <PauseCircle size={14} />,
        active: false
      };
    }
    
    switch (todayStatus) {
      case "present":
        return {
          text: "Present",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <CheckCircle size={14} />,
          active: true
        };
      case "late":
        return {
          text: "Late",
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: <Clock size={14} />,
          active: true
        };
      case "absent":
        return {
          text: "Absent",
          color: "bg-red-50 text-red-700 border-red-200",
          icon: <XCircle size={14} />,
          active: true
        };
      default:
        return {
          text: "Active",
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <CheckCircle size={14} />,
          active: true
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6 font-sans">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600 mt-1 text-sm">Manage your team members and their schedules</p>
          </div>
          
          <button
            onClick={() => {
              setIsEditMode(false);
              setSelectedEmployee(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
          >
            <UserPlus size={18} />
            Add New Employee
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Employees</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{filteredEmployees.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Briefcase className="text-blue-600" size={18} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Present Today</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {filteredEmployees.filter(e => e.stats?.today_status === "present" || e.stats?.today_status === "late").length}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="text-emerald-600" size={18} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Absent Today</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {filteredEmployees.filter(e => e.stats?.today_status === "absent").length}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle className="text-red-600" size={18} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Shifts</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {filteredEmployees.reduce((sum, emp) => sum + (emp.stats?.total_shifts || 0), 0)}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="text-purple-600" size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search employees by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="appearance-none w-full sm:w-40 pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                <option value="all">All Positions</option>
                {positions.map((pos, index) => (
                  <option key={index} value={pos}>{pos}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none w-full sm:w-40 pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="present">Present Today</option>
                <option value="late">Late Today</option>
                <option value="absent">Absent Today</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterPosition("all");
                setFilterStatus("all");
                fetchEmployees(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-sm"
            >
              <RefreshCw size={14} />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900">Employee</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900">Position</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900">Contact</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900">Shifts</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900">Joined</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => {
                    // ✅ Uses normalized isActive
                    const status = getStatusBadge(employee);
                    return (
                      <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              {employee.avatar ? (
                                <img src={employee.avatar} alt={employee.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <span className="font-semibold text-blue-600 text-sm">
                                  {employee.name?.charAt(0) || "E"}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{employee.name}</p>
                              <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                            <Briefcase size={12} />
                            {employee.position}
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Phone size={12} />
                              <span className="truncate">{employee.phone || "Not provided"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail size={12} />
                              <span className="truncate">{employee.email}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${status.color}`}>
                            {status.icon}
                            <span className="font-medium">{status.text}</span>
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.stats?.total_shifts || 0} shifts
                            </div>
                            <div className={`text-xs ${employee.stats?.clocked_in_today ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {employee.stats?.clocked_in_today ? 'Clocked in' : 'Not clocked in'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className="text-xs text-gray-600">
                            {formatDate(employee.createdAt)}
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className="relative" ref={el => actionsMenuRef.current[employee._id] = el}>
                            <button
                              onClick={() => setShowActionsMenu(showActionsMenu === employee._id ? null : employee._id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical size={18} className="text-gray-500" />
                            </button>
                            
                            {showActionsMenu === employee._id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <button
                                  onClick={() => handleViewDetails(employee)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                >
                                  <Eye size={14} />
                                  View Details
                                </button>
                                
                                <button
                                  onClick={() => handleViewAttendance(employee)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                >
                                  <BarChart3 size={14} />
                                  View Attendance
                                </button>
                                
                                <button
                                  onClick={() => handleEdit(employee)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                >
                                  <Edit2 size={14} />
                                  Edit
                                </button>
                                
                                <button
                                  onClick={() => handleToggleStatus(
                                    employee._id, 
                                    employee.isActive, // ✅ Correctly uses normalized status
                                    employee.name
                                  )}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                >
                                  <UserCog size={14} />
                                  {employee.isActive ? "Deactivate" : "Activate"}
                                </button>
                                
                                <div className="border-t border-gray-200">
                                  <button 
                                    onClick={() => handleDeleteEmployee(employee._id, employee.name)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                                  >
                                    <Trash2 size={14} />
                                    Delete
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
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UserPlus className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
                  {searchTerm || filterPosition !== "all" || filterStatus !== "all" 
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first employee"}
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
                  Add Employee
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredEmployees.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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