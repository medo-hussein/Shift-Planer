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
    
    const existingAttendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId,
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
    
    // Fetch the employee's full data to get their super_admin_id if it wasn't in the token
    let employeeSAId = tenantOwnerId;
    if (userRole === 'employee' && !employeeSAId) {
        const employee = await User.findById(userId).select('super_admin_id');
        employeeSAId = employee.super_admin_id;
    }
    
    // Find today's shift for the user
    const shift = await Shift.findOne({
      employee_id: userId,
      super_admin_id: employeeSAId,
      status: "scheduled",
      start_date_time: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // 🛑 CHECK: Prevent clock in if no shift exists
    if (!shift) {
      return res.status(400).json({
        message: "Cannot clock in: No shift scheduled for today.",
      });
    }

    // Calculate late minutes if shift exists
    let late_minutes = 0;
    const now = new Date();
    
    if (shift && shift.start_date_time < now) {
      late_minutes = Math.floor((now - shift.start_date_time) / (1000 * 60));
    }

    // Create attendance record
    const attendance = await Attendance.create({
      user_id: userId,
      super_admin_id: employeeSAId,
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

// CLOCK OUT (end shift) - ✅ Updated with Smart Overtime Logic
export const clockOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId = userRole === "super_admin" ? userId : req.user.super_admin_id; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Find today's active attendance record
    const attendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId,
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
    
    // 2. Find the related shift to check its TYPE
    const shift = await Shift.findOne({
      employee_id: userId,
      super_admin_id: tenantOwnerId,
      status: "in_progress",
      start_date_time: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // 3. Calculate Durations (Total Hours & Break Deduction)
    const workedMs = now - new Date(attendance.check_in);
    let totalHours = workedMs / (1000 * 60 * 60); // Hours as float

    // Subtract breaks
    if (attendance.breaks && attendance.breaks.length > 0) {
      const totalBreakMs = attendance.breaks.reduce((total, breakItem) => {
        if (breakItem.start && breakItem.end) {
          return total + (new Date(breakItem.end) - new Date(breakItem.start));
        }
        return total;
      }, 0);
      const totalBreakHours = totalBreakMs / (1000 * 60 * 60);
      totalHours = Math.max(0, totalHours - totalBreakHours);
    }

    totalHours = parseFloat(totalHours.toFixed(2));

    // 4. ✅ SMART OVERTIME LOGIC
    let overtime = 0;
    const SPECIAL_SHIFT_TYPES = ['overtime', 'holiday', 'weekend', 'emergency'];

    if (shift && SPECIAL_SHIFT_TYPES.includes(shift.shift_type)) {
        // Logic A: If shift is special, ALL hours are overtime
        overtime = totalHours;
    } else {
        // Logic B: Regular shift, overtime is anything > 8 hours
        const STANDARD_WORK_HOURS = 8;
        if (totalHours > STANDARD_WORK_HOURS) {
            overtime = totalHours - STANDARD_WORK_HOURS;
        }
    }
    
    overtime = parseFloat(overtime.toFixed(2));

    // 5. Save Updates (Using findByIdAndUpdate to set calculated fields directly)
    await Attendance.findByIdAndUpdate(attendance._id, {
        check_out: now,
        notes: req.body.notes || attendance.notes,
        total_hours: totalHours,
        overtime: overtime,
    });

    // 6. Complete the Shift
    if (shift) {
      shift.status = "completed";
      shift.actual_end_time = now;
      // Store actual calculated minutes in shift too for consistency
      shift.total_worked_minutes = Math.floor(totalHours * 60);
      shift.overtime_minutes = Math.floor(overtime * 60);
      await shift.save();
    }

    return res.json({
      message: "Clocked out successfully",
      attendance: {
        id: attendance._id,
        check_in: attendance.check_in,
        check_out: now,
        total_hours: totalHours,
        overtime: overtime,
        status: attendance.status
      },
      total_hours: totalHours,
      overtime: overtime
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
    const tenantOwnerId = userRole === "super_admin" ? userId : req.user.super_admin_id; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId,
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
    const tenantOwnerId = userRole === "super_admin" ? userId : req.user.super_admin_id; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId,
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
    
    // Optional: Calculate break duration right here for immediate feedback
    const durationMs = lastBreak.end - lastBreak.start;
    lastBreak.duration = Math.floor(durationMs / (1000 * 60)); // minutes

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
    const tenantOwnerId = req.user.super_admin_id; 

    let query = {
      user_id: userId,
      super_admin_id: tenantOwnerId
    };

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
      total_hours: attendance.reduce((sum, record) => sum + (record.total_hours || 0), 0),
      total_overtime: attendance.reduce((sum, record) => sum + (record.overtime || 0), 0)
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
    const tenantOwnerId = userRole === "super_admin" ? adminId : req.user.super_admin_id; 
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const employees = await User.find({ 
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId
    }).select('_id name email position');

    const employeeIds = employees.map(emp => emp._id);

    const attendance = await Attendance.find({
      user_id: { $in: employeeIds },
      super_admin_id: tenantOwnerId,
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    })
      .populate("user_id", "name email position")
      .sort({ check_in: -1 });

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
        attendance_rate: employees.length > 0 ? (presentCount / employees.length * 100).toFixed(1) : 0
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
    const tenantOwnerId = userRole === "super_admin" ? userId : req.user.super_admin_id; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay()); 

    let summary = {};

    if (userRole === "employee") {
      const todayAttendance = await Attendance.findOne({
        user_id: userId,
        super_admin_id: tenantOwnerId,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      const weekAttendance = await Attendance.find({
        user_id: userId,
        super_admin_id: tenantOwnerId,
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
          total_hours: weekAttendance.reduce((sum, a) => sum + (a.total_hours || 0), 0),
          total_overtime: weekAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0)
        }
      };
    } else if (userRole === "admin" || userRole === "super_admin") {
      const employees = await User.find({ 
        branch_admin_id: userId,
        role: "employee",
        super_admin_id: tenantOwnerId
      });

      const todayAttendance = await Attendance.find({
        user_id: { $in: employees.map(emp => emp._id) },
        super_admin_id: tenantOwnerId,
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
          attendance_rate: employees.length > 0 ? (presentCount / employees.length * 100).toFixed(1) : 0
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
    const tenantOwnerId = userRole === "super_admin" ? adminId : req.user.super_admin_id; 
    const employeeId = req.params.employeeId;
    const { start_date, end_date } = req.query;

    const employee = await User.findOne({
      _id: employeeId,
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found in your branch" });
    }

    let query = {
      user_id: employeeId,
      super_admin_id: tenantOwnerId
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
      total_hours: attendance.reduce((sum, record) => sum + (record.total_hours || 0), 0),
      total_overtime: attendance.reduce((sum, record) => sum + (record.overtime || 0), 0)
    });
  } catch (err) {
    console.error("getEmployeeAttendance error:", err);
    return res.status(500).json({ message: err.message });
  }
};