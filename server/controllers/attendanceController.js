import Attendance from "../models/attendanceModel.js";
import Shift from "../models/shiftModel.js";
import User from "../models/userModel.js";

// CLOCK IN (start shift) - Create attendance record
export const clockIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    // ISOLATION KEY: Get the Super Admin ID from the user object
    const tenantOwnerId = userRole === "super_admin" ? userId : req.user.super_admin_id; 

    // Check if already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add tenant isolation filter for defense in depth
    const existingAttendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "You have already clocked in today",
      });
    }
    
    // Fetch the employee's full data to get their super_admin_id if it wasn't in the token (defensive)
    let employeeSAId = tenantOwnerId;
    if (userRole === 'employee' && !employeeSAId) {
        const employee = await User.findById(userId).select('super_admin_id');
        employeeSAId = employee.super_admin_id;
    }
    
    // Find today's shift for the user (add tenant isolation filter)
    const shift = await Shift.findOne({
      employee_id: userId,
      super_admin_id: employeeSAId,
      status: "scheduled",
      start_date_time: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Calculate late minutes if shift exists
    let late_minutes = 0;
    const now = new Date();
    
    if (shift && shift.start_date_time < now) {
      late_minutes = Math.floor((now - shift.start_date_time) / (1000 * 60));
    }

    // Create attendance record
    const attendance = await Attendance.create({
      user_id: userId,
      super_admin_id: employeeSAId, // ISOLATION: Save the owner ID
      date: today,
      check_in: now,
      late_minutes: late_minutes,
      status: late_minutes > 0 ? "late" : "present",
      location: req.body.location || "Office"
    });

    // Update shift status if exists
    if (shift) {
      shift.status = "in_progress";
      shift.actual_start_time = now;
      await shift.save();
    }

    return res.status(201).json({
      message: "Clocked in successfully",
      attendance: {
        id: attendance._id,
        check_in: attendance.check_in,
        status: attendance.status,
        late_minutes: attendance.late_minutes,
        location: attendance.location
      },
      is_late: late_minutes > 0,
      late_minutes
    });
  } catch (err) {
    console.error("clockIn error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// CLOCK OUT (end shift)
export const clockOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    // ISOLATION KEY: Get the Super Admin ID from the user object
    const tenantOwnerId = userRole === "super_admin" ? userId : req.user.super_admin_id; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record (Add tenant isolation filter)
    const attendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      check_out: { $exists: false }
    });

    if (!attendance) {
      return res.status(400).json({
        message: "No active attendance record found or already clocked out",
      });
    }

    const now = new Date();
    attendance.check_out = now;
    attendance.notes = req.body.notes || attendance.notes;

    // The pre-save middleware in attendanceModel will run and calculate total_hours/overtime.
    await attendance.save();

    // Update shift status if exists (Add tenant isolation filter)
    const shift = await Shift.findOne({
      employee_id: userId,
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
      status: "in_progress",
      start_date_time: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (shift) {
      shift.status = "completed";
      shift.actual_end_time = now;
      await shift.save();
    }

    return res.json({
      message: "Clocked out successfully",
      attendance: {
        id: attendance._id,
        check_in: attendance.check_in,
        check_out: attendance.check_out,
        total_hours: attendance.total_hours,
        overtime: attendance.overtime,
        status: attendance.status
      },
      total_hours: attendance.total_hours,
      overtime: attendance.overtime
    });
  } catch (err) {
    console.error("clockOut error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// START BREAK
export const startBreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    // ISOLATION KEY: Get the Super Admin ID from the user object
    const tenantOwnerId = userRole === "super_admin" ? userId : req.user.super_admin_id; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active attendance record (Add tenant isolation filter)
    const attendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      check_out: { $exists: false }
    });

    if (!attendance) {
      return res.status(400).json({
        message: "No active attendance record found",
      });
    }

    // Check if already in a break
    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (lastBreak && !lastBreak.end) {
      return res.status(400).json({
        message: "You are already in a break",
      });
    }

    attendance.breaks.push({
      start: new Date(),
      end: null,
    });

    await attendance.save();

    return res.json({
      message: "Break started",
      break_start: new Date()
    });
  } catch (err) {
    console.error("startBreak error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// END BREAK
export const endBreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    // ISOLATION KEY: Get the Super Admin ID from the user object
    const tenantOwnerId = userRole === "super_admin" ? userId : req.user.super_admin_id; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record (Add tenant isolation filter)
    const attendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(400).json({
        message: "No attendance record found",
      });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];

    if (!lastBreak || lastBreak.end) {
      return res.status(400).json({
        message: "No active break to end",
      });
    }

    lastBreak.end = new Date();
    await attendance.save();

    return res.json({
      message: "Break ended",
      break_duration: lastBreak.duration,
      break_end: new Date()
    });
  } catch (err) {
    console.error("endBreak error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET MY ATTENDANCE (with date range filter)
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    // ISOLATION KEY: Get the Super Admin ID for filtering
    const tenantOwnerId = req.user.super_admin_id; 

    let query = {
      user_id: userId,
      super_admin_id: tenantOwnerId // ISOLATION: Filter by owner ID
    };

    // Add date range filter if provided
    const { start_date, end_date } = req.query;
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);

      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 });

    return res.json({
      records: attendance,
      total: attendance.length,
      total_hours: attendance.reduce((sum, record) => sum + record.total_hours, 0),
      total_overtime: attendance.reduce((sum, record) => sum + record.overtime, 0)
    });
  } catch (err) {
    console.error("getMyAttendance error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET BRANCH ATTENDANCE (Admin only)
export const getBranchAttendance = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    // ISOLATION KEY: Get the Super Admin ID for filtering
    const tenantOwnerId = userRole === "super_admin" ? adminId : req.user.super_admin_id; 
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all employees under this admin (filter by tenant owner)
    const employees = await User.find({ 
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId // ISOLATION: Filter employees by owner ID
    }).select('_id name email position');

    const employeeIds = employees.map(emp => emp._id);

    // Get attendance records (filter by tenant owner)
    const attendance = await Attendance.find({
      user_id: { $in: employeeIds },
      super_admin_id: tenantOwnerId, // ISOLATION: Filter attendance by owner ID
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    })
      .populate("user_id", "name email position")
      .sort({ check_in: -1 });

    // Calculate summary
    const presentCount = attendance.filter(a => a.status === "present" || a.status === "late").length;
    const lateCount = attendance.filter(a => a.status === "late").length;
    const absentCount = employees.length - presentCount;

    return res.json({
      branch_name: req.user.branch_name,
      date: targetDate,
      employees_total: employees.length,
      records: attendance,
      summary: {
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendance_rate: (presentCount / employees.length * 100).toFixed(1)
      }
    });
  } catch (err) {
    console.error("getBranchAttendance error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET ATTENDANCE SUMMARY (for dashboard)
export const getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    // ISOLATION KEY: Get the Super Admin ID for filtering
    const tenantOwnerId = userRole === "super_admin" ? userId : req.user.super_admin_id; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

    let summary = {};

    if (userRole === "employee") {
      // Employee summary (Filter by owner ID)
      const todayAttendance = await Attendance.findOne({
        user_id: userId,
        super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      const weekAttendance = await Attendance.find({
        user_id: userId,
        super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
        date: {
          $gte: thisWeek,
          $lte: today
        }
      });

      summary = {
        today: {
          clocked_in: !!todayAttendance?.check_in,
          check_in_time: todayAttendance?.check_in,
          status: todayAttendance?.status || "absent",
          worked_hours: todayAttendance?.total_hours || 0
        },
        this_week: {
          total_days: weekAttendance.length,
          present_days: weekAttendance.filter(a => a.status === "present" || a.status === "late").length,
          total_hours: weekAttendance.reduce((sum, a) => sum + a.total_hours, 0),
          total_overtime: weekAttendance.reduce((sum, a) => sum + a.overtime, 0)
        }
      };
    } else if (userRole === "admin" || userRole === "super_admin") {
      // Admin/Super Admin branch summary (Filter by tenant owner)
      const employees = await User.find({ 
        branch_admin_id: userId,
        role: "employee",
        super_admin_id: tenantOwnerId // ISOLATION: Filter employees by owner ID
      });

      const todayAttendance = await Attendance.find({
        user_id: { $in: employees.map(emp => emp._id) },
        super_admin_id: tenantOwnerId, // ISOLATION: Filter attendance by owner ID
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      const presentCount = todayAttendance.filter(a => a.status === "present" || a.status === "late").length;

      summary = {
        branch: {
          total_employees: employees.length,
          present_today: presentCount,
          absent_today: employees.length - presentCount,
          attendance_rate: (presentCount / employees.length * 100).toFixed(1)
        }
      };
    }

    return res.json(summary);
  } catch (err) {
    console.error("getAttendanceSummary error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET ATTENDANCE BY EMPLOYEE (Admin only)
export const getEmployeeAttendance = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    // ISOLATION KEY: Get the Super Admin ID for filtering
    const tenantOwnerId = userRole === "super_admin" ? adminId : req.user.super_admin_id; 
    const employeeId = req.params.employeeId;
    const { start_date, end_date } = req.query;

    // Verify employee belongs to this admin AND the current tenant
    const employee = await User.findOne({
      _id: employeeId,
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId // ISOLATION: Filter by owner ID
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found in your branch" });
    }

    let query = {
      user_id: employeeId,
      super_admin_id: tenantOwnerId // ISOLATION: Filter by owner ID
    };

    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);

      query.date = {
        $gte: start,
        $lte: end
      };
    }

    // Retrieve attendance records (already filtered by owner in query)
    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate("user_id", "name email position");

    return res.json({
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        position: employee.position
      },
      records: attendance,
      total: attendance.length,
      total_hours: attendance.reduce((sum, record) => sum + record.total_hours, 0),
      total_overtime: attendance.reduce((sum, record) => sum + record.overtime, 0)
    });
  } catch (err) {
    console.error("getEmployeeAttendance error:", err);
    return res.status(500).json({ message: err.message });
  }
};