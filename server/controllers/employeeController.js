import Attendance from "../models/attendanceModel.js";
import Shift from "../models/shiftModel.js";
import User from "../models/userModel.js";
import Report from "../models/reportModel.js";

// GET EMPLOYEE DASHBOARD
export const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    // Get dashboard data in parallel
    const [
      todayAttendance,
      todayShifts,
      weeklyAttendance,
      weeklyShifts,
      branchAdmin,
      upcomingShifts
    ] = await Promise.all([
      // Today's attendance
      Attendance.findOne({
        user_id: employeeId,
        date: { $gte: today }
      }),
      
      // Today's shifts
      Shift.find({
        employee_id: employeeId,
        start_date_time: { 
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      })
      .sort({ start_date_time: 1 }),
      
      // Weekly attendance summary
      Attendance.find({
        user_id: employeeId,
        date: { $gte: weekStart }
      }),
      
      // Weekly shifts
      Shift.find({
        employee_id: employeeId,
        start_date_time: { $gte: weekStart }
      }),
      
      // Branch admin info
      User.findById(req.user.branch_admin_id)
        .select('name branch_name phone email'),
      
      // Upcoming shifts (next 3 days)
      Shift.find({
        employee_id: employeeId,
        start_date_time: { 
          $gte: today,
          $lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
        },
        status: "scheduled"
      })
      .sort({ start_date_time: 1 })
      .limit(5)
    ]);

    // Calculate weekly stats
    const weeklyStats = {
      total_days: weeklyAttendance.length,
      present_days: weeklyAttendance.filter(a => 
        a.status === 'present' || a.status === 'late'
      ).length,
      total_hours: weeklyAttendance.reduce((sum, a) => sum + (a.total_hours || 0), 0),
      overtime: weeklyAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0)
    };

    const dashboardData = {
      today: {
        clocked_in: !!todayAttendance?.check_in,
        current_status: todayAttendance?.status || 'absent',
        check_in_time: todayAttendance?.check_in,
        today_shifts: todayShifts,
        current_shift: todayShifts.find(shift => 
          shift.status === 'in_progress' || 
          (shift.start_date_time <= new Date() && shift.end_date_time >= new Date())
        )
      },
      weekly: weeklyStats,
      branch: {
        admin: branchAdmin,
        name: branchAdmin?.branch_name
      },
      upcoming: {
        shifts: upcomingShifts,
        next_shift: upcomingShifts[0]
      }
    };

    return res.json({
      success: true,
      message: "Employee dashboard retrieved successfully",
      data: dashboardData
    });
  } catch (err) {
    console.error("getEmployeeDashboard error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET MY SHIFTS
export const getMyShifts = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { 
      start_date, 
      end_date, 
      page = 1, 
      limit = 20,
      status 
    } = req.query;

    let query = { employee_id: employeeId };

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
      .populate('created_by_admin_id', 'name branch_name')
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
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("getMyShifts error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET MY ATTENDANCE
export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { 
      start_date, 
      end_date, 
      page = 1, 
      limit = 30 
    } = req.query;

    let query = { user_id: employeeId };

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
      total_hours: attendance.reduce((sum, record) => sum + (record.total_hours || 0), 0),
      total_overtime: attendance.reduce((sum, record) => sum + (record.overtime || 0), 0),
      present_days: attendance.filter(record => 
        record.status === 'present' || record.status === 'late'
      ).length,
      late_days: attendance.filter(record => record.status === 'late').length
    };

    return res.json({
      success: true,
      message: "Attendance records retrieved successfully",
      data: {
        records: attendance,
        summary: summary
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("getMyAttendance error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// CLOCK IN
export const clockIn = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { location, notes } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existingAttendance = await Attendance.findOne({
      user_id: employeeId,
      date: { $gte: today }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "You have already clocked in today"
      });
    }

    // Find today's shift for late calculation
    const todayShift = await Shift.findOne({
      employee_id: employeeId,
      start_date_time: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      status: "scheduled"
    });

    // Calculate late minutes if shift exists
    let late_minutes = 0;
    const now = new Date();
    
    if (todayShift && todayShift.start_date_time < now) {
      late_minutes = Math.floor((now - todayShift.start_date_time) / (1000 * 60));
    }

    // Create attendance record
    const attendance = await Attendance.create({
      user_id: employeeId,
      date: today,
      check_in: now,
      late_minutes: late_minutes,
      status: late_minutes > 0 ? "late" : "present",
      location: location || "Office",
      notes: notes || ""
    });

    // Update shift status if exists
    if (todayShift) {
      todayShift.status = "in_progress";
      todayShift.actual_start_time = now;
      await todayShift.save();
    }

    return res.status(201).json({
      success: true,
      message: "Clocked in successfully",
      data: {
        attendance: {
          id: attendance._id,
          check_in: attendance.check_in,
          status: attendance.status,
          late_minutes: attendance.late_minutes,
          location: attendance.location
        },
        is_late: late_minutes > 0,
        late_minutes: late_minutes
      }
    });
  } catch (err) {
    console.error("clockIn error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// CLOCK OUT
export const clockOut = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { notes } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      user_id: employeeId,
      date: { $gte: today },
      check_out: { $exists: false }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "No active attendance record found or already clocked out"
      });
    }

    const now = new Date();
    attendance.check_out = now;
    attendance.notes = notes || attendance.notes;

    await attendance.save();

    // Update shift status if exists
    const todayShift = await Shift.findOne({
      employee_id: employeeId,
      start_date_time: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      status: "in_progress"
    });

    if (todayShift) {
      todayShift.status = "completed";
      todayShift.actual_end_time = now;
      await todayShift.save();
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
          status: attendance.status
        },
        total_hours: attendance.total_hours,
        overtime: attendance.overtime
      }
    });
  } catch (err) {
    console.error("clockOut error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// START BREAK
export const startBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { notes } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user_id: employeeId,
      date: { $gte: today },
      check_out: { $exists: false }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "No active attendance record found"
      });
    }

    // Check if already in a break
    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (lastBreak && !lastBreak.end) {
      return res.status(400).json({
        success: false,
        message: "You are already in a break"
      });
    }

    attendance.breaks.push({
      start: new Date(),
      end: null,
      notes: notes || ""
    });

    await attendance.save();

    return res.json({
      success: true,
      message: "Break started",
      data: {
        break_start: new Date(),
        break_count: attendance.breaks.length
      }
    });
  } catch (err) {
    console.error("startBreak error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// END BREAK
export const endBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user_id: employeeId,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "No attendance record found"
      });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];

    if (!lastBreak || lastBreak.end) {
      return res.status(400).json({
        success: false,
        message: "No active break to end"
      });
    }

    lastBreak.end = new Date();
    await attendance.save();

    return res.json({
      success: true,
      message: "Break ended",
      data: {
        break_duration: lastBreak.duration,
        break_end: new Date()
      }
    });
  } catch (err) {
    console.error("endBreak error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET MY PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const employee = await User.findById(employeeId)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Get branch admin info
    const branchAdmin = await User.findById(employee.branch_admin_id)
      .select('name branch_name email phone');

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
      branch: {
        name: branchAdmin?.branch_name,
        admin: {
          name: branchAdmin?.name,
          email: branchAdmin?.email,
          phone: branchAdmin?.phone
        }
      }
    };

    return res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: profileData
    });
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// UPDATE MY PROFILE
export const updateMyProfile = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { name, phone } = req.body;

    const employee = await User.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Update allowed fields (employees can only update name and phone)
    if (name) employee.name = name;
    if (phone !== undefined) employee.phone = phone;

    await employee.save();

    const updatedEmployee = await User.findById(employeeId)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedEmployee
    });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET TODAY'S STATUS
export const getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [attendance, shifts] = await Promise.all([
      Attendance.findOne({
        user_id: employeeId,
        date: { $gte: today }
      }),
      Shift.find({
        employee_id: employeeId,
        start_date_time: { 
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      })
      .sort({ start_date_time: 1 })
    ]);

    const currentShift = shifts.find(shift => 
      shift.status === 'in_progress' || 
      (shift.start_date_time <= new Date() && shift.end_date_time >= new Date())
    );

    const status = {
      clocked_in: !!attendance?.check_in,
      check_in_time: attendance?.check_in,
      check_out_time: attendance?.check_out,
      current_status: attendance?.status || 'absent',
      today_shifts: shifts,
      current_shift: currentShift,
      can_clock_in: !attendance?.check_in,
      can_clock_out: !!attendance?.check_in && !attendance?.check_out
    };

    return res.json({
      success: true,
      message: "Today's status retrieved successfully",
      data: status
    });
  } catch (err) {
    console.error("getTodayStatus error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET MY REPORTS
export const getMyReports = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { type, page = 1, limit = 10 } = req.query;

    let query = {
      $or: [
        { employee_id: employeeId },
        { access_level: "branch" },
        { access_level: "company_wide", is_public: true },
        { shared_with_users: employeeId }
      ]
    };

    if (type) {
      query.type = type;
    }

    const reports = await Report.find(query)
      .populate('generated_by_admin_id', 'name branch_name')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    return res.json({
      success: true,
      message: "Reports retrieved successfully",
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
      message: err.message 
    });
  }
};