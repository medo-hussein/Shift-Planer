import Attendance from "../models/attendanceModel.js";
import Shift from "../models/shiftModel.js";
import User from "../models/userModel.js";
import { calculateDistance } from "../utils/geoUtils.js";

const GRACE_PERIOD_MINUTES = 15;      // سماحية التأخير (Late)
const EARLY_CLOCK_IN_MINUTES = 15;    // ✅ سماحية الحضور المبكر (Early)

// CLOCK IN (start shift) - Create attendance record
export const clockIn = async (req, res) => {
  try {
    // ✅ FIX: Extract location, notes, and coordinates from request body first
    const { location, notes, userLat, userLng } = req.body;

    const userId = req.user._id;
    const userRole = req.user.role;
    // ISOLATION KEY: Get the Super Admin ID from the user object
    const tenantOwnerId =
      userRole === "super_admin" ? userId : req.user.super_admin_id;

    // ============================================================
    // GEOFENCING CHECK START
    // ============================================================
    if (userRole === "employee" && req.user.branch_admin_id) {
      // userLat and userLng are now available from the top destructuring

      const branchAdmin = await User.findById(req.user.branch_admin_id);

      if (
        branchAdmin &&
        branchAdmin.branch_location &&
        branchAdmin.branch_location.lat
      ) {
        const {
          lat: branchLat,
          lng: branchLng,
          radius,
        } = branchAdmin.branch_location;

        if (!userLat || !userLng) {
          return res.status(400).json({
            message: "Location is required to clock in. Please enable GPS.",
          });
        }

        const distance = calculateDistance(
          userLat,
          userLng,
          branchLat,
          branchLng
        );
        const allowedRadius = radius || 200;

        if (distance > allowedRadius) {
          return res.status(403).json({
            message: `You are out of range. Distance: ${Math.round(
              distance
            )}m. Allowed: ${allowedRadius}m.`,
            distance: Math.round(distance),
            allowed_radius: allowedRadius,
          });
        }
      }
    }
    // ============================================================
    //  GEOFENCING CHECK END
    // ============================================================

    // Check if already clocked in today (or has open session)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date(); // Capture exact time

    // ✅ FIX: Check for ANY open session regardless of date
    const existingAttendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId,
      check_out: { $exists: false }, // Check only for active sessions
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "You have already clocked in",
      });
    }

    // Fetch the employee's full data to get their super_admin_id if it wasn't in the token
    let employeeSAId = tenantOwnerId;
    if (userRole === "employee" && !employeeSAId) {
      const employee = await User.findById(userId).select("super_admin_id");
      employeeSAId = employee.super_admin_id;
    }

    // 1. SMART SHIFT SELECTION: Get ALL scheduled shifts for today
    const todayShifts = await Shift.find({
      employee_id: userId,
      super_admin_id: employeeSAId,
      status: "scheduled",
      start_date_time: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!todayShifts || todayShifts.length === 0) {
      return res.status(400).json({
        message: "Cannot clock in: No shift scheduled for today.",
      });
    }

    // 2. Select the Closest Shift to "Now"
    let selectedShift = todayShifts.reduce((closest, current) => {
      const currentDiff = Math.abs(now - new Date(current.start_date_time));
      const closestDiff = Math.abs(now - new Date(closest.start_date_time));
      return currentDiff < closestDiff ? current : closest;
    });

    // ============================================================
    // ✅ NEW FIX: PREVENT EARLY CLOCK-IN
    // ============================================================
    const shiftStartTime = new Date(selectedShift.start_date_time);

    // Check if user is clocking in BEFORE the shift starts
    if (now < shiftStartTime) {
      const diffMs = shiftStartTime - now;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // If trying to clock in earlier than allowed limit
      if (diffMinutes > EARLY_CLOCK_IN_MINUTES) {
        return res.status(400).json({
          message: `Too early! You can only clock in ${EARLY_CLOCK_IN_MINUTES} minutes before your shift starts.`,
          shift_start: selectedShift.start_date_time,
          allowed_early_minutes: EARLY_CLOCK_IN_MINUTES
        });
      }
    }
    // ============================================================

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

    // Create attendance record
    const attendance = await Attendance.create({
      user_id: userId,
      super_admin_id: employeeSAId,
      date: now, // Use actual time
      check_in: now,
      late_minutes: late_minutes,
      status: late_minutes > 0 ? "late" : "present",
      location: location || "Office", // ✅ Now 'location' is defined
      notes: notes || "", // ✅ Now 'notes' is defined
    });

    // Update shift status
    selectedShift.status = "in_progress";
    selectedShift.actual_start_time = now;
    await selectedShift.save();

    return res.status(201).json({
      message: "Clocked in successfully",
      attendance: {
        id: attendance._id,
        check_in: attendance.check_in,
        status: attendance.status,
        late_minutes: attendance.late_minutes,
        location: attendance.location,
      },
      is_late: late_minutes > 0,
      late_minutes,
    });
  } catch (err) {
    console.error("clockIn error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// CLOCK OUT (end shift) - Updated with Smart Overtime Logic
export const clockOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId =
      userRole === "super_admin" ? userId : req.user.super_admin_id;
    const { notes } = req.body;

    const now = new Date();

    // ✅ FIX OVERNIGHT: Find ANY active attendance record regardless of date
    const attendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId,
      check_out: { $exists: false },
    });

    if (!attendance) {
      return res.status(400).json({
        message: "No active attendance record found or already clocked out",
      });
    }

    // Find the related shift (The one currently IN PROGRESS)
    const shift = await Shift.findOne({
      employee_id: userId,
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
    return res.status(500).json({ message: err.message });
  }
};

// START BREAK
export const startBreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId =
      userRole === "super_admin" ? userId : req.user.super_admin_id;
    const { notes } = req.body;

    // ✅ FIX OVERNIGHT
    const attendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId,
      check_out: { $exists: false },
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
      notes: notes || "",
    });

    await attendance.save();

    return res.json({
      message: "Break started",
      break_start: new Date(),
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
    const tenantOwnerId =
      userRole === "super_admin" ? userId : req.user.super_admin_id;

    // ✅ FIX OVERNIGHT
    const attendance = await Attendance.findOne({
      user_id: userId,
      super_admin_id: tenantOwnerId,
      check_out: { $exists: false },
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
    const durationMs = lastBreak.end - lastBreak.start;
    lastBreak.duration = Math.floor(durationMs / (1000 * 60)); // minutes

    await attendance.save();

    return res.json({
      message: "Break ended",
      break_duration: lastBreak.duration,
      break_end: new Date(),
    });
  } catch (err) {
    console.error("endBreak error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET MY ATTENDANCE
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const tenantOwnerId = req.user.super_admin_id;

    let query = {
      user_id: userId,
      super_admin_id: tenantOwnerId,
    };

    const { start_date, end_date } = req.query;
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);

      query.date = {
        $gte: start,
        $lte: end,
      };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });

    return res.json({
      records: attendance,
      total: attendance.length,
      total_hours: attendance.reduce(
        (sum, record) => sum + (record.total_hours || 0),
        0
      ),
      total_overtime: attendance.reduce(
        (sum, record) => sum + (record.overtime || 0),
        0
      ),
    });
  } catch (err) {
    console.error("getMyAttendance error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ✅ GET BRANCH ATTENDANCE (Admin only) - FIXED FOR OVERNIGHT
export const getBranchAttendance = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId =
      userRole === "super_admin" ? adminId : req.user.super_admin_id;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Create Next Day object for comparison
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    // Check if requesting "Today"
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isRequestingToday = targetDate.getTime() === today.getTime();

    const employees = await User.find({
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId,
    }).select("_id name email position");

    const employeeIds = employees.map((emp) => emp._id);

    let query = {
      user_id: { $in: employeeIds },
      super_admin_id: tenantOwnerId,
    };

    if (isRequestingToday) {
      // ✅ FIX: If requesting today, get today's records OR any active record (Overnight)
      query.$or = [
        { date: { $gte: targetDate, $lt: nextDay } }, // Records created today
        { check_out: { $exists: false } } // Active records (even from yesterday)
      ];
    } else {
      // For past dates, strictly use the date
      query.date = { $gte: targetDate, $lt: nextDay };
    }

    const attendance = await Attendance.find(query)
      .populate("user_id", "name email position")
      .sort({ check_in: -1 });

    const presentCount = attendance.filter(
      (a) => a.status === "present" || a.status === "late"
    ).length;
    const lateCount = attendance.filter((a) => a.status === "late").length;

    // Calculate active now count
    const activeCount = attendance.filter((a) => !a.check_out).length;

    const absentCount = Math.max(0, employees.length - presentCount);

    return res.json({
      branch_name: req.user.branch_name,
      date: targetDate,
      employees_total: employees.length,
      records: attendance,
      summary: {
        present: presentCount,
        active: activeCount, // Added active count
        late: lateCount,
        absent: absentCount,
        attendance_rate:
          employees.length > 0
            ? ((presentCount / employees.length) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (err) {
    console.error("getBranchAttendance error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET ATTENDANCE SUMMARY (for dashboard)
// ✅ FIXED: Now checks active sessions first to show correct "Clocked In" status for overnight
export const getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId =
      userRole === "super_admin" ? userId : req.user.super_admin_id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());

    let summary = {};

    if (userRole === "employee") {
      // ✅ FIX: 1. Check for Active Session FIRST (Overnight support)
      let currentSession = await Attendance.findOne({
        user_id: userId,
        super_admin_id: tenantOwnerId,
        check_out: { $exists: false },
      });

      // 2. If no active session, check for any completed session today
      let todayRecord = currentSession;
      if (!todayRecord) {
        todayRecord = await Attendance.findOne({
          user_id: userId,
          super_admin_id: tenantOwnerId,
          date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }).sort({ check_in: -1 });
      }

      // 3. Get Weekly Stats
      const weekAttendance = await Attendance.find({
        user_id: userId,
        super_admin_id: tenantOwnerId,
        date: {
          $gte: thisWeek,
          $lte: today,
        },
      });

      summary = {
        today: {
          clocked_in: !!currentSession, // True ONLY if currently active
          check_in_time: todayRecord?.check_in,
          status: todayRecord?.status || "absent",
          worked_hours: todayRecord?.total_hours || 0,
        },
        this_week: {
          total_days: weekAttendance.length,
          present_days: weekAttendance.filter(
            (a) => a.status === "present" || a.status === "late"
          ).length,
          total_hours: weekAttendance.reduce(
            (sum, a) => sum + (a.total_hours || 0),
            0
          ),
          total_overtime: weekAttendance.reduce(
            (sum, a) => sum + (a.overtime || 0),
            0
          ),
        },
      };
    } else if (userRole === "admin" || userRole === "super_admin") {
      const employees = await User.find({
        branch_admin_id: userId,
        role: "employee",
        super_admin_id: tenantOwnerId,
      });

      // For admin dashboard, include active overnight sessions
      const todayAttendance = await Attendance.find({
        user_id: { $in: employees.map((emp) => emp._id) },
        super_admin_id: tenantOwnerId,
        $or: [
          { date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
          { check_out: { $exists: false } }
        ]
      });

      const presentCount = todayAttendance.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;

      summary = {
        branch: {
          total_employees: employees.length,
          present_today: presentCount,
          absent_today: employees.length - presentCount,
          attendance_rate:
            employees.length > 0
              ? ((presentCount / employees.length) * 100).toFixed(1)
              : 0,
        },
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
    const tenantOwnerId =
      userRole === "super_admin" ? adminId : req.user.super_admin_id;
    const employeeId = req.params.employeeId;
    const { start_date, end_date } = req.query;

    const employee = await User.findOne({
      _id: employeeId,
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId,
    });

    if (!employee) {
      return res
        .status(404)
        .json({ message: "Employee not found in your branch" });
    }

    let query = {
      user_id: employeeId,
      super_admin_id: tenantOwnerId,
    };

    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);

      query.date = {
        $gte: start,
        $lte: end,
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
        position: employee.position,
      },
      records: attendance,
      total: attendance.length,
      total_hours: attendance.reduce(
        (sum, record) => sum + (record.total_hours || 0),
        0
      ),
      total_overtime: attendance.reduce(
        (sum, record) => sum + (record.overtime || 0),
        0
      ),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ===========================================
// 💰 PAYROLL: Calculate Wages (Smart Estimator)
// ===========================================
export const getPayrollReport = async (req, res) => {
  try {
    const adminId = req.user._id;
    const tenantOwnerId = req.user.role === 'super_admin' ? adminId : req.user.super_admin_id;
    const { start_date, end_date } = req.query;

    // 1. Determine Date Range
    // Default: Current Month (from 1st to today)
    const now = new Date();
    const start = start_date ? new Date(start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = end_date ? new Date(end_date) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 2. Fetch Employees for this Branch
    const employees = await User.find({
      branch_admin_id: adminId,
      role: 'employee',
      super_admin_id: tenantOwnerId
    }).select('name email position hourly_rate currency avatar');

    // 3. Aggregate Attendance for Each Employee
    const payrollData = await Promise.all(employees.map(async (emp) => {
      // Find all attendance records for this period
      const records = await Attendance.find({
        user_id: emp._id,
        super_admin_id: tenantOwnerId,
        date: { $gte: start, $lte: end },
        status: { $in: ['present', 'late'] }
      });

      // Calculate Totals
      let totalHours = 0;
      let totalOvertime = 0;
      let totalLateMinutes = 0;

      records.forEach(rec => {
        totalHours += (rec.total_hours || 0);
        totalOvertime += (rec.overtime || 0);
        totalLateMinutes += (rec.late_minutes || 0);
      });

      // 🧠 SMART WAGE CALCULATION LOGIC
      const rate = emp.hourly_rate || 0;

      // Base Pay: (Total Hours - Overtime) * Rate
      // We subtract overtime from total_hours because total_hours usually includes overtime duration
      // But we want to pay overtime at a PREMIUM rate (1.5x)

      const regularHours = Math.max(0, totalHours - totalOvertime);

      const basePay = regularHours * rate;
      const overtimePay = totalOvertime * rate * 1.5; // 1.5x Premium

      // Late Deduction (Straight time deduction for minutes lost? Or calculated separately?)
      // For simplicity in this version: We don't deduct explicitly from "worked hours" because 
      // the "total_hours" already reflects the actual time worked (late arrival = less time worked).
      // So we just rely on actual clock-in/out duration.

      const totalSalary = basePay + overtimePay;

      return {
        id: emp._id,
        name: emp.name,
        position: emp.position,
        avatar: emp.avatar,
        hourly_rate: rate,
        currency: emp.currency || 'EGP',
        stats: {
          total_hours: parseFloat(totalHours.toFixed(2)),
          regular_hours: parseFloat(regularHours.toFixed(2)),
          overtime_hours: parseFloat(totalOvertime.toFixed(2)),
          late_minutes: totalLateMinutes
        },
        financials: {
          base_pay: Math.round(basePay),
          overtime_pay: Math.round(overtimePay),
          total_salary: Math.round(totalSalary)
        }
      };
    }));

    return res.json({
      period: {
        start: start,
        end: end
      },
      currency: employees[0]?.currency || 'EGP',
      total_payroll_cost: payrollData.reduce((sum, item) => sum + item.financials.total_salary, 0),
      report: payrollData
    });

  } catch (err) {
    console.error("getPayrollReport error:", err);
    return res.status(500).json({ message: err.message });
  }
};