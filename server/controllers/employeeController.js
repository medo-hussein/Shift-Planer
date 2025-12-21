import Attendance from "../models/attendanceModel.js";
import Shift from "../models/shiftModel.js";
import User from "../models/userModel.js";
import Report from "../models/reportModel.js";

// ✅ إعداد فترة السماح
const GRACE_PERIOD_MINUTES = 15;

// Utility function to get the Super Admin ID (Tenant Owner ID)
const getTenantOwnerId = (user) => {
  // For employee, the owner ID is stored in super_admin_id field
  return user.super_admin_id;
};

// GET EMPLOYEE DASHBOARD
export const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // FIX: Ensure weekStart is set to the beginning of the day (00:00:00)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday as start of week

    // ✅ FIX OVERNIGHT: Get Active Attendance regardless of date first
    const activeAttendance = await Attendance.findOne({
      user_id: employeeId,
      super_admin_id: tenantOwnerId,
      check_out: { $exists: false }
    });

    // Get dashboard data in parallel (All queries now filtered by tenantOwnerId)
    const [
      todayAttendanceRecord, // For history/stats fallback
      todayShifts,
      weeklyAttendance,
      weeklyShifts,
      branchAdmin,
      upcomingShifts,
    ] = await Promise.all([
      // Today's attendance (For showing 'checked in today' if started today)
      Attendance.findOne({
        user_id: employeeId,
        super_admin_id: tenantOwnerId,
        date: { $gte: today },
      }),

      // Today's shifts (ISOLATION)
      Shift.find({
        employee_id: employeeId,
        super_admin_id: tenantOwnerId,
        start_date_time: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      }).sort({ start_date_time: 1 }),

      // Weekly attendance summary (ISOLATION)
      Attendance.find({
        user_id: employeeId,
        super_admin_id: tenantOwnerId,
        date: { $gte: weekStart },
      }),

      // Weekly shifts (ISOLATION)
      Shift.find({
        employee_id: employeeId,
        super_admin_id: tenantOwnerId,
        start_date_time: { $gte: weekStart },
      }),

      // Branch admin info
      User.findById(req.user.branch_admin_id).select(
        "name branch_name phone email"
      ),

      // Upcoming shifts (next 3 days) (ISOLATION)
      Shift.find({
        employee_id: employeeId,
        super_admin_id: tenantOwnerId,
        start_date_time: {
          $gte: today,
          $lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
        status: "scheduled",
      })
        .sort({ start_date_time: 1 })
        .limit(5),
    ]);

    // Determine which attendance to show as "Current Status"
    // If there is an active attendance (even from yesterday), use it.
    const displayAttendance = activeAttendance || todayAttendanceRecord;

    // Calculate weekly stats
    const weeklyStats = {
      total_days: weeklyAttendance.length,
      present_days: weeklyAttendance.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length,
      total_hours: parseFloat(
        weeklyAttendance
          .reduce((sum, a) => sum + (a.total_hours || 0), 0)
          .toFixed(2)
      ),
      overtime: parseFloat(
        weeklyAttendance
          .reduce((sum, a) => sum + (a.overtime || 0), 0)
          .toFixed(2)
      ),
      late_days: weeklyAttendance.filter((a) => a.status === "late").length,
    };

    // ✅ FIX: Enhanced logic to find the "current" shift even if not started yet
    const now = new Date();
    // 1. First check for IN_PROGRESS shift
    let currentShift = await Shift.findOne({
      employee_id: employeeId,
      super_admin_id: tenantOwnerId,
      status: "in_progress"
    });

    // 2. If no in_progress shift, check today's shifts
    if (!currentShift) {
      currentShift = todayShifts.find(
        (shift) => shift.start_date_time <= now && shift.end_date_time >= now
      );
    }

    if (!currentShift) {
      // If still no shift, find the first scheduled shift for today (e.g. upcoming/early arrival)
      currentShift = todayShifts.find((shift) => shift.status === "scheduled");
    }

    const dashboardData = {
      today: {
        clocked_in: !!displayAttendance?.check_in && !displayAttendance?.check_out,
        current_status: displayAttendance?.status || "absent",
        check_in_time: displayAttendance?.check_in,
        today_shifts: todayShifts,
        current_shift: currentShift, // Updated logic
      },
      weekly: weeklyStats,
      branch: {
        admin: branchAdmin,
        name: branchAdmin?.branch_name,
      },
      upcoming: {
        shifts: upcomingShifts,
        next_shift: upcomingShifts[0],
      },
      user_rate: req.user.hourly_rate || 0,
      currency: req.user.currency || "EGP",
    };

    return res.json({
      success: true,
      message: "Employee dashboard retrieved successfully",
      data: dashboardData,
    });
  } catch (err) {
    console.error("getEmployeeDashboard error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET MY SHIFTS
export const getMyShifts = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { start_date, end_date, page = 1, limit = 20, status } = req.query;

    let query = {
      employee_id: employeeId,
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
    };

    // Add date range filter
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);

      query.start_date_time = { $gte: start, $lte: end };
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    const shifts = await Shift.find(query)
      .populate("created_by_admin_id", "name branch_name")
      .sort({ start_date_time: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Shift.countDocuments(query);

    return res.json({
      success: true,
      message: "Shifts retrieved successfully",
      data: shifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getMyShifts error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET MY ATTENDANCE
export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY

    const { start_date, end_date, page = 1, limit = 30 } = req.query;

    let query = {
      user_id: employeeId,
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
    };

    // Add date range filter
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    // Calculate summary
    const summary = {
      total_records: total,
      total_hours: attendance.reduce(
        (sum, record) => sum + (record.total_hours || 0),
        0
      ),
      total_overtime: attendance.reduce(
        (sum, record) => sum + (record.overtime || 0),
        0
      ),
      present_days: attendance.filter(
        (record) => record.status === "present" || record.status === "late"
      ).length,
      late_days: attendance.filter((record) => record.status === "late").length,
    };

    return res.json({
      success: true,
      message: "Attendance records retrieved successfully",
      data: {
        records: attendance,
        summary: summary,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getMyAttendance error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// CLOCK IN
export const clockIn = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { location, notes } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date(); // Capture exact time

    // ✅ FIX OVERNIGHT: Check for ANY open session regardless of date
    const existingAttendance = await Attendance.findOne({
      user_id: employeeId,
      super_admin_id: tenantOwnerId, // ISOLATION
      check_out: { $exists: false }, // Check only for active sessions
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "You have already clocked in",
      });
    }

    // 1. SMART SHIFT SELECTION: Get ALL scheduled shifts for today
    const todayShifts = await Shift.find({
      employee_id: employeeId,
      super_admin_id: tenantOwnerId,
      status: "scheduled",
      start_date_time: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!todayShifts || todayShifts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot clock in: No shift scheduled for today.",
      });
    }

    // 2. Select the Closest Shift to "Now"
    let selectedShift = todayShifts.reduce((closest, current) => {
      const currentDiff = Math.abs(now - new Date(current.start_date_time));
      const closestDiff = Math.abs(now - new Date(closest.start_date_time));
      return currentDiff < closestDiff ? current : closest;
    });

    // 3. Calculate Late Minutes with Grace Period
    let late_minutes = 0;

    if (selectedShift.start_date_time < now) {
      const diffMinutes = Math.floor(
        (now - selectedShift.start_date_time) / (1000 * 60)
      );

      if (diffMinutes > GRACE_PERIOD_MINUTES) {
        late_minutes = diffMinutes;
      }
    }

    // Create attendance record (ISOLATION)
    const attendance = await Attendance.create({
      user_id: employeeId,
      super_admin_id: tenantOwnerId, // ISOLATION: Save the owner ID
      date: now, // Use actual date
      check_in: now,
      late_minutes: late_minutes,
      status: late_minutes > 0 ? "late" : "present", // Correct status based on grace period
      location: location || "Office",
      notes: notes || "",
    });

    // Update shift status
    selectedShift.status = "in_progress";
    selectedShift.actual_start_time = now;
    await selectedShift.save();

    return res.status(201).json({
      success: true,
      message: "Clocked in successfully",
      data: {
        attendance: {
          id: attendance._id,
          check_in: attendance.check_in,
          status: attendance.status,
          late_minutes: attendance.late_minutes,
          location: attendance.location,
        },
        is_late: late_minutes > 0,
        late_minutes: late_minutes,
      },
    });
  } catch (err) {
    console.error("clockIn error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// CLOCK OUT
export const clockOut = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { notes } = req.body;

    const now = new Date();

    // ✅ FIX OVERNIGHT: Find ANY active attendance record regardless of date
    const attendance = await Attendance.findOne({
      user_id: employeeId,
      super_admin_id: tenantOwnerId, // ISOLATION
      check_out: { $exists: false },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "No active attendance record found or already clocked out",
      });
    }

    // Find the related shift (The one currently IN PROGRESS)
    const shift = await Shift.findOne({
      employee_id: employeeId,
      super_admin_id: tenantOwnerId,
      status: "in_progress",
    });

    // Calculate Durations
    const workedMs = now - new Date(attendance.check_in);
    let totalHours = workedMs / (1000 * 60 * 60);

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

    // Smart Overtime Logic
    let overtime = 0;
    const SPECIAL_SHIFT_TYPES = ["overtime", "holiday", "weekend", "emergency"];

    if (shift && SPECIAL_SHIFT_TYPES.includes(shift.shift_type)) {
      overtime = totalHours;
    } else {
      const STANDARD_WORK_HOURS = 8;
      if (totalHours > STANDARD_WORK_HOURS) {
        overtime = totalHours - STANDARD_WORK_HOURS;
      }
    }
    overtime = parseFloat(overtime.toFixed(2));

    // Save Updates
    attendance.check_out = now;
    attendance.notes = notes || attendance.notes;
    attendance.total_hours = totalHours;
    attendance.overtime = overtime;

    await attendance.save();

    // Update shift status if exists
    if (shift) {
      shift.status = "completed";
      shift.actual_end_time = now;
      shift.total_worked_minutes = Math.floor(totalHours * 60);
      shift.overtime_minutes = Math.floor(overtime * 60);
      await shift.save();
    }

    return res.json({
      success: true,
      message: "Clocked out successfully",
      data: {
        attendance: {
          id: attendance._id,
          check_in: attendance.check_in,
          check_out: attendance.check_out,
          total_hours: attendance.total_hours,
          overtime: attendance.overtime,
          status: attendance.status,
        },
        total_hours: attendance.total_hours,
        overtime: attendance.overtime,
      },
    });
  } catch (err) {
    console.error("clockOut error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// START BREAK
export const startBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { notes } = req.body;

    // ✅ FIX OVERNIGHT: active session only
    const attendance = await Attendance.findOne({
      user_id: employeeId,
      super_admin_id: tenantOwnerId, // ISOLATION
      check_out: { $exists: false },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "No active attendance record found",
      });
    }

    // Check if already in a break
    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (lastBreak && !lastBreak.end) {
      return res.status(400).json({
        success: false,
        message: "You are already in a break",
      });
    }

    attendance.breaks.push({
      start: new Date(),
      end: null,
      notes: notes || "",
    });

    await attendance.save();

    return res.json({
      success: true,
      message: "Break started",
      data: {
        break_start: new Date(),
        break_count: attendance.breaks.length,
      },
    });
  } catch (err) {
    console.error("startBreak error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// END BREAK
export const endBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY

    // ✅ FIX OVERNIGHT: active session only
    const attendance = await Attendance.findOne({
      user_id: employeeId,
      super_admin_id: tenantOwnerId, // ISOLATION
      check_out: { $exists: false },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "No attendance record found",
      });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];

    if (!lastBreak || lastBreak.end) {
      return res.status(400).json({
        success: false,
        message: "No active break to end",
      });
    }

    lastBreak.end = new Date();

    // Optional: Calculate break duration right here for immediate feedback
    const durationMs = lastBreak.end - lastBreak.start;
    lastBreak.duration = Math.floor(durationMs / (1000 * 60)); // minutes

    await attendance.save();

    return res.json({
      success: true,
      message: "Break ended",
      data: {
        break_duration: lastBreak.duration,
        break_end: new Date(),
      },
    });
  } catch (err) {
    console.error("endBreak error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET MY PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const employeeId = req.user._id;
    // Note: tenantOwnerId is read for context, but User.findById(employeeId) is inherently tenant-safe if the token is valid

    const employee = await User.findById(employeeId).select(
      "-password -resetPasswordToken -resetPasswordExpire"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Get branch admin info
    const branchAdmin = await User.findById(employee.branch_admin_id).select(
      "name branch_name email phone"
    );

    const profileData = {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      is_active: employee.is_active,
      lastLogin: employee.lastLogin,
      created_at: employee.createdAt,
      super_admin_id: employee.super_admin_id, // ISOLATION: Adding owner ID to profile
      branch: {
        name: branchAdmin?.branch_name,
        admin: {
          name: branchAdmin?.name,
          email: branchAdmin?.email,
          phone: branchAdmin?.phone,
        },
      },
    };

    return res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: profileData,
    });
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE MY PROFILE
export const updateMyProfile = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Update allowed fields (employees can only update name and phone)
    const { name, phone } = req.body;
    if (name) employee.name = name;
    if (phone !== undefined) employee.phone = phone;

    await employee.save();

    const updatedEmployee = await User.findById(employeeId).select(
      "-password -resetPasswordToken -resetPasswordExpire"
    );

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET TODAY'S STATUS
export const getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ FIX OVERNIGHT: 1. Try to find an ACTIVE attendance first (Active Session)
    let attendance = await Attendance.findOne({
      user_id: employeeId,
      super_admin_id: tenantOwnerId, // ISOLATION
      check_out: { $exists: false }, // Open session
    });

    // If no active session, find if there was a closed session *today* just for history
    if (!attendance) {
      attendance = await Attendance.findOne({
        user_id: employeeId,
        super_admin_id: tenantOwnerId,
        date: { $gte: today },
      });
    }

    // Shifts
    const shifts = await Shift.find({
      employee_id: employeeId,
      super_admin_id: tenantOwnerId, // ISOLATION
      start_date_time: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).sort({ start_date_time: 1 });

    // ✅ FIX: Enhanced logic to find the "current" shift even if not started yet
    const now = new Date();
    // 1. Look for shift marked as IN_PROGRESS (Most accurate)
    let currentShift = await Shift.findOne({
      employee_id: employeeId,
      super_admin_id: tenantOwnerId,
      status: "in_progress"
    });

    if (!currentShift) {
      // 2. If no shift is active, try to find one overlapping with current time from today's list
      currentShift = shifts.find(
        (shift) => shift.start_date_time <= now && shift.end_date_time >= now
      );
    }

    if (!currentShift) {
      // 3. Fallback: Find first scheduled
      currentShift = shifts.find((shift) => shift.status === "scheduled");
    }

    // ✅ CHECK IF ON BREAK
    const isOnBreak = attendance?.breaks?.some(b => b.start && !b.end);

    const status = {
      clocked_in: !!(attendance && !attendance.check_out),
      check_in_time: attendance?.check_in,
      check_out_time: attendance?.check_out,
      current_status: attendance?.status || "absent",
      is_on_break: !!isOnBreak, // ✅ Explicitly send break status
      today_shifts: shifts,
      current_shift: currentShift, // Updated logic
      can_clock_in: !(attendance && !attendance.check_out),
      can_clock_out: !!(attendance && !attendance.check_out),
    };

    return res.json({
      success: true,
      message: "Today's status retrieved successfully",
      data: status,
    });
  } catch (err) {
    console.error("getTodayStatus error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET MY REPORTS
export const getMyReports = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { type, page = 1, limit = 10 } = req.query;

    let query = {
      super_admin_id: tenantOwnerId, // ISOLATION: Base filter for all reports
    };

    if (type) {
      query.type = type;
    }

    // Only my reports
    query.created_by = employeeId;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    return res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error("getMyReports error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ============================================
// 💰 GET MY PAY SLIP
// ============================================
export const getMyPayslip = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user);
    const { start_date, end_date } = req.query;

    // 1. Determine Date Range (Default: Current Month)
    const now = new Date();
    const start = start_date ? new Date(start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = end_date ? new Date(end_date) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 2. Fetch Employee Data (Rate & Currency)
    const employee = await User.findById(employeeId).select('name email position hourly_rate currency joinedAt');

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // 3. Fetch Attendance Records
    const attendanceRecords = await Attendance.find({
      user_id: employeeId,
      super_admin_id: tenantOwnerId,
      date: { $gte: start, $lte: end },
      status: { $in: ['present', 'late'] }
    }).sort({ date: 1 });

    // 4. Calculate Totals
    let totalHours = 0;
    let totalOvertime = 0;
    let totalLateMinutes = 0;
    let presentDays = attendanceRecords.length;

    attendanceRecords.forEach(rec => {
      totalHours += (rec.total_hours || 0);
      totalOvertime += (rec.overtime || 0);
      totalLateMinutes += (rec.late_minutes || 0);
    });

    // 5. Calculate Financials
    const rate = employee.hourly_rate || 0;
    const regularHours = Math.max(0, totalHours - totalOvertime);
    const basePay = regularHours * rate;
    const overtimePay = totalOvertime * rate * 1.5; // 1.5x Multiplier
    const totalSalary = basePay + overtimePay;

    // 6. Construct Payslip Object
    const payslip = {
      employee: {
        name: employee.name,
        position: employee.position,
        email: employee.email,
        id: employee._id
      },
      period: {
        start: start,
        end: end
      },
      currency: employee.currency || 'EGP',
      rate: rate,
      summary: {
        total_hours: parseFloat(totalHours.toFixed(2)),
        regular_hours: parseFloat(regularHours.toFixed(2)),
        overtime_hours: parseFloat(totalOvertime.toFixed(2)),
        present_days: presentDays,
        late_minutes: totalLateMinutes
      },
      financials: {
        base_pay: Math.round(basePay),
        overtime_pay: Math.round(overtimePay),
        total_earning: Math.round(totalSalary) // No deductions yet
      },
      breakdown: attendanceRecords.map(rec => ({
        date: rec.date,
        check_in: rec.check_in,
        check_out: rec.check_out,
        hours: rec.total_hours,
        overtime: rec.overtime,
        status: rec.status
      }))
    };

    return res.json({
      success: true,
      message: "Payslip retrieved successfully",
      data: payslip
    });

  } catch (err) {
    console.error("getMyPayslip error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



// ✅ GET COLLEAGUES (For Swap Selection)
export const getColleagues = async (req, res) => {
  try {
    const userId = req.user._id;
    const branchAdminId = req.user.branch_admin_id; // الموظف تابع لنفس الأدمن
    const tenantOwnerId = req.user.super_admin_id;

    // هات كل الموظفين في نفس الفرع ماعدا أنا
    const colleagues = await User.find({
      branch_admin_id: branchAdminId,
      super_admin_id: tenantOwnerId,
      role: "employee",
      _id: { $ne: userId }, // استبعاد نفسي
      is_active: true,
    }).select("name email position avatar");

    return res.json({
      success: true,
      data: colleagues,
    });
  } catch (err) {
    console.error("getColleagues error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ GET COLLEAGUE SHIFTS (For Shift-for-Shift Swap)
export const getColleagueShifts = async (req, res) => {
  try {
    const { colleagueId } = req.params;
    const tenantOwnerId = getTenantOwnerId(req.user);

    // Get future scheduled shifts for the colleague
    const shifts = await Shift.find({
      employee_id: colleagueId,
      super_admin_id: tenantOwnerId,
      status: "scheduled",
      start_date_time: { $gt: new Date() }, // Future only
    })
      .sort({ start_date_time: 1 })
      .select("_id start_date_time end_date_time title shift_type");

    return res.json({
      success: true,
      data: shifts,
    });
  } catch (err) {
    console.error("getColleagueShifts error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};