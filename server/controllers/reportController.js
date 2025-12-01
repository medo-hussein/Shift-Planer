import Report from "../models/reportModel.js";
import Attendance from "../models/attendanceModel.js";
import User from "../models/userModel.js";
import Shift from "../models/shiftModel.js";

// GENERATE ATTENDANCE REPORT
export const generateAttendanceReport = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const { start_date, end_date, employee_id, type = "summary" } = req.body;

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can generate reports" 
      });
    }

    // Validate dates
    const start = new Date(start_date);
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid date format" 
      });
    }

    if (start >= end) {
      return res.status(400).json({ 
        success: false,
        message: "Start date must be before end date" 
      });
    }

    // Build query based on user role
    let attendanceQuery = {
      date: { $gte: start, $lte: end }
    };

    let employees = [];
    
    if (userRole === "admin") {
      // Admin can only access their branch employees
      employees = await User.find({ 
        branch_admin_id: adminId,
        role: "employee"
      });
      
      const employeeIds = employees.map(emp => emp._id);
      
      if (employee_id) {
        // Verify the employee belongs to this admin
        if (!employeeIds.includes(employee_id)) {
          return res.status(403).json({ 
            success: false,
            message: "Employee not found in your branch" 
          });
        }
        attendanceQuery.user_id = employee_id;
      } else {
        attendanceQuery.user_id = { $in: employeeIds };
      }
    } else if (userRole === "super_admin") {
      // Super admin can access all employees
      employees = await User.find({ role: "employee" });
      
      if (employee_id) {
        attendanceQuery.user_id = employee_id;
        const employee = await User.findById(employee_id);
        if (employee) employees = [employee];
      } else {
        const employeeIds = employees.map(emp => emp._id);
        attendanceQuery.user_id = { $in: employeeIds };
      }
    }

    // Get attendance data
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate("user_id", "name email position branch_admin_id")
      .sort({ date: 1 });

    // Calculate report data based on type
    let reportData = {};
    
    switch (type) {
      case "summary":
        reportData = await generateAttendanceSummary(attendanceRecords, start, end, employees);
        break;
      case "detailed":
        reportData = await generateDetailedAttendance(attendanceRecords, start, end);
        break;
      case "overtime":
        reportData = await generateOvertimeReport(attendanceRecords, start, end);
        break;
      default:
        reportData = await generateAttendanceSummary(attendanceRecords, start, end, employees);
    }

    // Create report record
    const report = await Report.create({
      type: "attendance",
      period: "custom",
      start_date: start,
      end_date: end,
      title: `Attendance Report - ${start.toDateString()} to ${end.toDateString()}`,
      description: `Attendance report for ${employees.length} employees`,
      data: reportData,
      generated_by_admin_id: adminId,
      employee_id: employee_id || null,
      format: type === "detailed" ? "detailed" : "summary"
    });

    return res.status(201).json({
      success: true,
      message: "Attendance report generated successfully",
      data: {
        report_info: {
          id: report._id,
          title: report.title,
          type: report.type,
          period: report.period,
          start_date: report.start_date,
          end_date: report.end_date,
          format: report.format,
          generated_at: report.createdAt
        },
        report_data: reportData  // ⭐⭐ إضافة البيانات الفعلية
      }
    });
  } catch (err) {
    console.error("generateAttendanceReport error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GENERATE SHIFT REPORT
export const generateShiftReport = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const { start_date, end_date, employee_id, shift_type } = req.body;

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can generate reports" 
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999);

    // Build query based on user role
    let shiftQuery = {
      start_date_time: { $gte: start, $lte: end }
    };

    if (userRole === "admin") {
      // Admin can only access their branch employees
      const employees = await User.find({ 
        branch_admin_id: adminId,
        role: "employee"
      });
      const employeeIds = employees.map(emp => emp._id);
      
      if (employee_id) {
        if (!employeeIds.includes(employee_id)) {
          return res.status(403).json({ 
            success: false,
            message: "Employee not found in your branch" 
          });
        }
        shiftQuery.employee_id = employee_id;
      } else {
        shiftQuery.employee_id = { $in: employeeIds };
      }
    } else if (userRole === "super_admin" && employee_id) {
      shiftQuery.employee_id = employee_id;
    }

    if (shift_type) {
      shiftQuery.shift_type = shift_type;
    }

    // Get shift data
    const shifts = await Shift.find(shiftQuery)
      .populate("employee_id", "name email position")
      .populate("created_by_admin_id", "name branch_name")
      .sort({ start_date_time: 1 });

    // Generate shift report data
    const reportData = await generateShiftAnalysis(shifts, start, end);

    // Create report record
    const report = await Report.create({
      type: "shift",
      period: "custom",
      start_date: start,
      end_date: end,
      title: `Shift Report - ${start.toDateString()} to ${end.toDateString()}`,
      description: `Shift report covering ${shifts.length} shifts`,
      data: reportData,
      generated_by_admin_id: adminId,
      employee_id: employee_id || null,
      format: "summary"
    });

    return res.status(201).json({
      success: true,
      message: "Shift report generated successfully",
      data: {
        report_info: {
          id: report._id,
          title: report.title,
          type: report.type,
          period: report.period,
          start_date: report.start_date,
          end_date: report.end_date,
          format: report.format,
          generated_at: report.createdAt
        },
        report_data: reportData  // ⭐⭐ إضافة البيانات الفعلية
      }
    });
  } catch (err) {
    console.error("generateShiftReport error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GENERATE EMPLOYEE PERFORMANCE REPORT
export const generatePerformanceReport = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const { start_date, end_date, employee_id } = req.body;

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can generate reports" 
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999);

    // Build queries based on user role
    let employeeQuery = { role: "employee" };
    let attendanceQuery = { date: { $gte: start, $lte: end } };
    let shiftQuery = { start_date_time: { $gte: start, $lte: end } };

    if (userRole === "admin") {
      employeeQuery.branch_admin_id = adminId;
      
      const employees = await User.find(employeeQuery);
      const employeeIds = employees.map(emp => emp._id);
      
      if (employee_id) {
        if (!employeeIds.includes(employee_id)) {
          return res.status(403).json({ 
            success: false,
            message: "Employee not found in your branch" 
          });
        }
        attendanceQuery.user_id = employee_id;
        shiftQuery.employee_id = employee_id;
      } else {
        attendanceQuery.user_id = { $in: employeeIds };
        shiftQuery.employee_id = { $in: employeeIds };
      }
    } else if (userRole === "super_admin" && employee_id) {
      attendanceQuery.user_id = employee_id;
      shiftQuery.employee_id = employee_id;
      employeeQuery._id = employee_id;
    }

    // Get data in parallel
    const [employees, attendanceRecords, shifts] = await Promise.all([
      User.find(employeeQuery).select('name email position branch_admin_id'),
      Attendance.find(attendanceQuery),
      Shift.find(shiftQuery)
    ]);

    // Generate performance analysis
    const reportData = await generatePerformanceAnalysis(employees, attendanceRecords, shifts, start, end);

    // Create report record
    const report = await Report.create({
      type: "performance",
      period: "custom",
      start_date: start,
      end_date: end,
      title: `Performance Report - ${start.toDateString()} to ${end.toDateString()}`,
      description: `Performance report for ${employees.length} employees`,
      data: reportData,
      generated_by_admin_id: adminId,
      employee_id: employee_id || null,
      format: "summary"
    });

    return res.status(201).json({
      success: true,
      message: "Performance report generated successfully",
      data: {
        report_info: {
          id: report._id,
          title: report.title,
          type: report.type,
          period: report.period,
          start_date: report.start_date,
          end_date: report.end_date,
          format: report.format,
          generated_at: report.createdAt
        },
        report_data: reportData  // ⭐⭐ إضافة البيانات الفعلية
      }
    });
  } catch (err) {
    console.error("generatePerformanceReport error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET ALL REPORTS
export const getReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { type, period, page = 1, limit = 10 } = req.query;

    let query = {};

    // Build query based on user role
    if (userRole === "admin") {
      query.generated_by_admin_id = userId;
    } else if (userRole === "employee") {
      query.$or = [
        { employee_id: userId },
        { access_level: "branch" },
        { access_level: "company_wide", is_public: true },
        { shared_with_users: userId }
      ];
    }
    // Super admin can see all reports (no additional query)

    // Add filters
    if (type) query.type = type;
    if (period) query.period = period;

    const reports = await Report.find(query)
      .populate("generated_by_admin_id", "name email branch_name")
      .populate("employee_id", "name email position")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    return res.json({
      success: true,
      data: {
        reports: reports.map(report => ({
          id: report._id,
          title: report.title,
          type: report.type,
          period: report.period,
          start_date: report.start_date,
          end_date: report.end_date,
          format: report.format,
          generated_by: report.generated_by_admin_id,
          created_at: report.createdAt,
          access_level: report.access_level,
          is_public: report.is_public
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error("getReports error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET REPORT BY ID
export const getReportById = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate("generated_by_admin_id", "name email branch_name")
      .populate("employee_id", "name email position")
      .populate("shared_with_users", "name email");

    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: "Report not found" 
      });
    }

    // Check permissions using the model method
    if (!report.canUserAccess(userId, userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view this report" 
      });
    }

    return res.json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error("getReportById error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// SHARE REPORT WITH USERS
export const shareReport = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { id } = req.params;
    const { user_ids, access_level = "private" } = req.body;

    if (!["super_admin", "admin"].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can share reports" 
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: "Report not found" 
      });
    }

    // Check if user owns the report or is super admin
    if (report.generated_by_admin_id.toString() !== adminId.toString() && req.user.role !== "super_admin") {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to share this report" 
      });
    }

    // Verify all users exist
    const users = await User.find({ 
      _id: { $in: user_ids }
    });

    if (users.length !== user_ids.length) {
      return res.status(400).json({ 
        success: false,
        message: "Some users not found" 
      });
    }

    // Update report sharing settings
    report.shared_with_users = user_ids;
    report.access_level = access_level;
    report.is_public = access_level === "company_wide";
    
    await report.save();

    return res.json({
      success: true,
      message: "Report shared successfully",
      data: {
        shared_with: users.map(user => ({ 
          id: user._id, 
          name: user.name, 
          email: user.email 
        })),
        access_level: report.access_level
      }
    });
  } catch (err) {
    console.error("shareReport error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// DELETE REPORT
export const deleteReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: "Report not found" 
      });
    }

    // Check permissions: only owner or super admin can delete
    const isOwner = report.generated_by_admin_id.toString() === userId.toString();
    const isSuperAdmin = userRole === "super_admin";

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to delete this report" 
      });
    }

    await Report.findByIdAndDelete(id);

    return res.json({ 
      success: true,
      message: "Report deleted successfully" 
    });
  } catch (err) {
    console.error("deleteReport error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET DASHBOARD STATISTICS
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    let stats = {};

    if (userRole === "employee") {
      // Employee dashboard stats
      const [todayAttendance, weekAttendance, totalShifts] = await Promise.all([
        Attendance.findOne({
          user_id: userId,
          date: { $gte: today }
        }),
        Attendance.find({
          user_id: userId,
          date: { $gte: weekStart }
        }),
        Shift.countDocuments({
          employee_id: userId,
          start_date_time: { $gte: monthStart }
        })
      ]);

      stats = {
        today: {
          clocked_in: !!todayAttendance?.check_in,
          status: todayAttendance?.status || "absent",
          worked_hours: todayAttendance?.total_hours || 0
        },
        this_week: {
          total_days: weekAttendance.length,
          present_days: weekAttendance.filter(a => a.status === "present" || a.status === "late").length,
          total_hours: weekAttendance.reduce((sum, a) => sum + a.total_hours, 0),
          overtime: weekAttendance.reduce((sum, a) => sum + a.overtime, 0)
        },
        this_month: {
          total_shifts: totalShifts
        }
      };

    } else if (userRole === "admin") {
      // Admin branch dashboard stats
      const employees = await User.find({ 
        branch_admin_id: userId,
        role: "employee"
      });

      const employeeIds = employees.map(emp => emp._id);

      const [todayAttendance, weekAttendance, pendingShifts, branchReports] = await Promise.all([
        Attendance.find({
          user_id: { $in: employeeIds },
          date: { $gte: today }
        }),
        Attendance.find({
          user_id: { $in: employeeIds },
          date: { $gte: weekStart }
        }),
        Shift.countDocuments({
          employee_id: { $in: employeeIds },
          status: "scheduled",
          start_date_time: { $gte: today }
        }),
        Report.countDocuments({
          generated_by_admin_id: userId,
          created_at: { $gte: monthStart }
        })
      ]);

      const presentToday = todayAttendance.filter(a => a.status === "present" || a.status === "late").length;

      stats = {
        branch: {
          total_employees: employees.length,
          present_today: presentToday,
          absent_today: employees.length - presentToday,
          attendance_rate: (presentToday / employees.length * 100).toFixed(1)
        },
        this_week: {
          total_hours: weekAttendance.reduce((sum, a) => sum + a.total_hours, 0),
          total_overtime: weekAttendance.reduce((sum, a) => sum + a.overtime, 0),
          average_hours: (weekAttendance.reduce((sum, a) => sum + a.total_hours, 0) / employees.length).toFixed(2)
        },
        upcoming: {
          pending_shifts: pendingShifts
        },
        reports: {
          generated_this_month: branchReports
        }
      };

    } else if (userRole === "super_admin") {
      // Super admin system-wide stats
      const [totalAdmins, totalEmployees, totalReports, systemAttendance] = await Promise.all([
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "employee" }),
        Report.countDocuments({ created_at: { $gte: monthStart } }),
        Attendance.countDocuments({ date: { $gte: today } })
      ]);

      stats = {
        system: {
          total_branches: totalAdmins,
          total_employees: totalEmployees,
          active_today: systemAttendance,
          reports_generated: totalReports
        },
        this_month: {
          new_branches: await User.countDocuments({ 
            role: "admin", 
            created_at: { $gte: monthStart } 
          }),
          new_employees: await User.countDocuments({ 
            role: "employee", 
            created_at: { $gte: monthStart } 
          })
        }
      };
    }

    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// HELPER FUNCTIONS (بدون تغيير)
async function generateAttendanceSummary(records, start, end, employees) {
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const employeeIds = [...new Set(records.map(r => r.user_id._id.toString()))];
  
  const summary = {
    period: { start, end, total_days: totalDays },
    total_records: records.length,
    total_employees: employees.length,
    employees_with_records: employeeIds.length,
    attendance_rate: 0,
    total_worked_hours: 0,
    total_overtime_hours: 0,
    late_count: 0,
    by_employee: [],
    daily_summary: []
  };

  // Calculate by employee
  const employeeMap = new Map();
  
  records.forEach(record => {
    const empId = record.user_id._id.toString();
    if (!employeeMap.has(empId)) {
      employeeMap.set(empId, {
        employee: record.user_id,
        records: [],
        total_worked: 0,
        overtime: 0,
        late_count: 0
      });
    }
    
    const empData = employeeMap.get(empId);
    empData.records.push(record);
    empData.total_worked += record.total_hours || 0;
    empData.overtime += record.overtime || 0;
    if (record.status === "late") empData.late_count++;
  });

  summary.by_employee = Array.from(employeeMap.values()).map(emp => ({
    employee: {
      id: emp.employee._id,
      name: emp.employee.name,
      email: emp.employee.email,
      position: emp.employee.position
    },
    total_worked_hours: emp.total_worked.toFixed(2),
    overtime_hours: emp.overtime.toFixed(2),
    late_count: emp.late_count,
    attendance_rate: ((emp.records.length / totalDays) * 100).toFixed(2)
  }));

  // Calculate totals
  summary.total_worked_hours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0).toFixed(2);
  summary.total_overtime_hours = records.reduce((sum, r) => sum + (r.overtime || 0), 0).toFixed(2);
  summary.late_count = records.filter(r => r.status === "late").length;
  summary.attendance_rate = employeeIds.length > 0 ? 
    ((records.length / (employeeIds.length * totalDays)) * 100).toFixed(2) : 0;

  return summary;
}

async function generateDetailedAttendance(records, start, end) {
  return {
    period: { start, end },
    records: records.map(record => ({
      date: record.date,
      employee: {
        id: record.user_id._id,
        name: record.user_id.name,
        email: record.user_id.email
      },
      check_in: record.check_in,
      check_out: record.check_out,
      total_hours: record.total_hours,
      overtime: record.overtime,
      status: record.status,
      breaks: record.breaks,
      location: record.location,
      notes: record.notes
    }))
  };
}

async function generateOvertimeReport(records, start, end) {
  const overtimeRecords = records.filter(r => r.overtime > 0);
  
  return {
    period: { start, end },
    total_overtime_hours: overtimeRecords.reduce((sum, r) => sum + r.overtime, 0).toFixed(2),
    employees: overtimeRecords.map(record => ({
      employee: {
        id: record.user_id._id,
        name: record.user_id.name,
        email: record.user_id.email
      },
      date: record.date,
      overtime_hours: record.overtime.toFixed(2),
      total_worked_hours: record.total_hours,
      reason: record.notes
    }))
  };
}

async function generateShiftAnalysis(shifts, start, end) {
  const summary = {
    period: { start, end },
    total_shifts: shifts.length,
    by_status: {
      scheduled: shifts.filter(s => s.status === "scheduled").length,
      in_progress: shifts.filter(s => s.status === "in_progress").length,
      completed: shifts.filter(s => s.status === "completed").length,
      cancelled: shifts.filter(s => s.status === "cancelled").length
    },
    by_type: {
      regular: shifts.filter(s => s.shift_type === "regular").length,
      overtime: shifts.filter(s => s.shift_type === "overtime").length,
      holiday: shifts.filter(s => s.shift_type === "holiday").length,
      weekend: shifts.filter(s => s.shift_type === "weekend").length,
      emergency: shifts.filter(s => s.shift_type === "emergency").length
    },
    by_employee: [],
    coverage_rate: 0
  };

  // Calculate by employee
  const employeeMap = new Map();
  shifts.forEach(shift => {
    const empId = shift.employee_id._id.toString();
    if (!employeeMap.has(empId)) {
      employeeMap.set(empId, {
        employee: shift.employee_id,
        shifts: [],
        total_hours: 0
      });
    }
    
    const empData = employeeMap.get(empId);
    empData.shifts.push(shift);
    const shiftHours = shift.getScheduledDuration ? shift.getScheduledDuration() / 60 : 0;
    empData.total_hours += shiftHours;
  });

  summary.by_employee = Array.from(employeeMap.values()).map(emp => ({
    employee: emp.employee,
    total_shifts: emp.shifts.length,
    total_hours: emp.total_hours.toFixed(2),
    completed_shifts: emp.shifts.filter(s => s.status === "completed").length
  }));

  return summary;
}

async function generatePerformanceAnalysis(employees, attendanceRecords, shifts, start, end) {
  const performanceData = [];
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  employees.forEach(employee => {
    const empId = employee._id.toString();
    
    const empAttendance = attendanceRecords.filter(record => 
      record.user_id.toString() === empId
    );
    
    const empShifts = shifts.filter(shift => 
      shift.employee_id.toString() === empId
    );

    const totalWorkedHours = empAttendance.reduce((sum, record) => sum + (record.total_hours || 0), 0);
    const totalOvertime = empAttendance.reduce((sum, record) => sum + (record.overtime || 0), 0);
    const lateCount = empAttendance.filter(record => record.status === "late").length;
    const completedShifts = empShifts.filter(shift => shift.status === "completed").length;
    
    const attendanceRate = totalDays > 0 ? (empAttendance.length / totalDays) * 100 : 0;
    const shiftCompletionRate = empShifts.length > 0 ? (completedShifts / empShifts.length) * 100 : 0;

    performanceData.push({
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        position: employee.position
      },
      attendance: {
        rate: attendanceRate.toFixed(2),
        total_days: empAttendance.length,
        late_count: lateCount
      },
      work: {
        total_hours: totalWorkedHours.toFixed(2),
        overtime_hours: totalOvertime.toFixed(2),
        average_daily_hours: (totalWorkedHours / (empAttendance.length || 1)).toFixed(2)
      },
      shifts: {
        total: empShifts.length,
        completed: completedShifts,
        completion_rate: shiftCompletionRate.toFixed(2)
      },
      performance_score: calculatePerformanceScore(
        attendanceRate, 
        shiftCompletionRate, 
        lateCount, 
        totalOvertime
      )
    });
  });

  return {
    period: { start, end },
    employees: performanceData,
    averages: {
      avg_attendance: (performanceData.reduce((sum, emp) => sum + parseFloat(emp.attendance.rate), 0) / performanceData.length).toFixed(2),
      avg_performance: (performanceData.reduce((sum, emp) => sum + emp.performance_score, 0) / performanceData.length).toFixed(2)
    }
  };
}

function calculatePerformanceScore(attendanceRate, shiftCompletionRate, lateCount, overtime) {
  let score = 0;
  
  // Attendance weight: 40%
  score += (attendanceRate * 0.4);
  
  // Shift completion weight: 30%
  score += (shiftCompletionRate * 0.3);
  
  // Punctuality weight: 20% (penalty for lateness)
  const punctualityScore = Math.max(0, 100 - (lateCount * 5));
  score += (punctualityScore * 0.2);
  
  // Overtime bonus: 10% (capped at 20 hours overtime)
  const overtimeBonus = Math.min(overtime, 20) * 0.5;
  score += overtimeBonus;
  
  return Math.min(score, 100).toFixed(2);
}