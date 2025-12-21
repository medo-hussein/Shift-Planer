import User from "../models/userModel.js";
import Shift from "../models/shiftModel.js";
import Attendance from "../models/attendanceModel.js";

// Utility function to get the Super Admin ID (Tenant Owner ID)
const getTenantOwnerId = (user) => {
  return user.role === "super_admin" ? user._id : user.super_admin_id;
};

// GET ADMIN DASHBOARD STATS
export const getAdminDashboard = async (req, res) => {
  try {
    const adminId = req.user._id;
    const branchName = req.user.branch_name;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY

    // 1. Find all employee IDs and the total counts for this admin and tenant
    const ownedEmployees = await User.find({
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
    }).select("_id is_active");

    const employeeIds = ownedEmployees.map((emp) => emp._id);
    const totalEmployees = ownedEmployees.length;
    const activeEmployees = ownedEmployees.filter(
      (emp) => emp.is_active
    ).length;

    // Get today's start and end
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get dashboard data in parallel for owned employees/shifts/attendance
    const [todayShifts, todayAttendance, pendingShifts, recentEmployees] =
      await Promise.all([
        // Today's shifts (Fixed: Limit to end of day)
        Shift.countDocuments({
          employee_id: { $in: employeeIds },
          super_admin_id: tenantOwnerId, // ISOLATION
          start_date_time: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        }),

        // Today's attendance
        Attendance.countDocuments({
          user_id: { $in: employeeIds },
          super_admin_id: tenantOwnerId, // ISOLATION
          date: { $gte: startOfDay },
        }),

        // Pending shifts (scheduled but not started)
        Shift.countDocuments({
          employee_id: { $in: employeeIds },
          super_admin_id: tenantOwnerId, // ISOLATION
          status: "scheduled",
        }),

        // Recent employees (last 5)
        User.find({
          branch_admin_id: adminId,
          role: "employee",
          super_admin_id: tenantOwnerId, // ISOLATION
        })
          .select("name email position is_active createdAt avatar") // ✅ Added avatar & Fixed createdAt
          .sort({ createdAt: -1 }) // ✅ Fixed sort field
          .limit(5),
      ]);

    // Get weekly attendance summary (requires aggregation on owned records)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week

    const weeklyAttendance = await Attendance.aggregate([
      {
        $match: {
          user_id: { $in: employeeIds },
          super_admin_id: tenantOwnerId, // ISOLATION
          date: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      branch: {
        name: branchName,
        total_employees: totalEmployees,
        active_employees: activeEmployees,
      },
      today: {
        shifts: todayShifts,
        attendance: todayAttendance,
        pending_shifts: pendingShifts,
      },
      weekly_attendance: weeklyAttendance,
      recent_employees: recentEmployees,
    };

    return res.json({
      success: true,
      message: "Admin dashboard data retrieved successfully",
      data: stats,
    });
  } catch (err) {
    console.error("getAdminDashboard error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET BRANCH EMPLOYEES (✅ FIXED FOR OVERNIGHT STATUS)
export const getBranchEmployees = async (req, res) => {
  try {
    const adminId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { page = 1, limit = 10, is_active, search, position } = req.query;

    let query = {
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
    };

    // Add filters
    if (is_active !== undefined) {
      query.is_active = is_active === "true";
    }

    if (position) {
      query.position = { $regex: position, $options: "i" };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get additional stats for each employee
    const employeesWithStats = await Promise.all(
      employees.map(async (employee) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ✅ FIX: Find Active Session OR Today's Session
        // This ensures the status list shows "Present" for overnight shifts
        let todayAttendance = await Attendance.findOne({
          user_id: employee._id,
          super_admin_id: tenantOwnerId,
          check_out: { $exists: false } // Priority 1: Currently Active
        });

        // If no active session, find if they attended today and left
        if (!todayAttendance) {
          todayAttendance = await Attendance.findOne({
            user_id: employee._id,
            super_admin_id: tenantOwnerId,
            date: { $gte: today }
          }).sort({ createdAt: -1 });
        }

        const [totalShifts, recentShifts] = await Promise.all([
          Shift.countDocuments({
            employee_id: employee._id,
            super_admin_id: tenantOwnerId, // ISOLATION
          }),
          Shift.find({
            employee_id: employee._id,
            super_admin_id: tenantOwnerId, // ISOLATION
          })
            .sort({ start_date_time: -1 })
            .limit(3),
        ]);

        return {
          ...employee.toObject(),
          stats: {
            clocked_in_today: !!(todayAttendance && !todayAttendance.check_out),
            today_status: todayAttendance?.status || "absent",
            total_shifts: totalShifts,
            recent_shifts: recentShifts,
          },
        };
      })
    );

    return res.json({
      success: true,
      data: employeesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getBranchEmployees error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET EMPLOYEE DETAILS
export const getEmployeeDetails = async (req, res) => {
  try {
    const adminId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { employeeId } = req.params;

    // Verify employee belongs to this branch AND tenant
    const employee = await User.findOne({
      _id: employeeId,
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
    }).select("-password -resetPasswordToken -resetPasswordExpire");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in your branch",
      });
    }

    // Get employee statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // All subsequent queries must be filtered by the tenantOwnerId
    const [
      todayAttendance,
      weeklyAttendance,
      totalShifts,
      upcomingShifts,
      attendanceHistory,
    ] = await Promise.all([
      // Today's attendance
      Attendance.findOne({
        user_id: employeeId,
        super_admin_id: tenantOwnerId, // ISOLATION
        date: { $gte: today },
      }),

      // Weekly attendance summary
      Attendance.aggregate([
        {
          $match: {
            user_id: employeeId,
            super_admin_id: tenantOwnerId, // ISOLATION
            date: { $gte: weekStart },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Total shifts
      Shift.countDocuments({
        employee_id: employeeId,
        super_admin_id: tenantOwnerId, // ISOLATION
      }),

      // Upcoming shifts (next 7 days)
      Shift.find({
        employee_id: employeeId,
        super_admin_id: tenantOwnerId, // ISOLATION
        start_date_time: {
          $gte: today,
          $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      })
        .sort({ start_date_time: 1 })
        .limit(5),

      // Attendance history (last 15 days)
      Attendance.find({
        user_id: employeeId,
        super_admin_id: tenantOwnerId, // ISOLATION
        date: {
          $gte: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        },
      })
        .sort({ date: -1 })
        .limit(15),
    ]);

    const employeeDetails = {
      profile: employee,
      statistics: {
        total_shifts: totalShifts,
        weekly_attendance: weeklyAttendance,
        today_attendance: todayAttendance,
      },
      upcoming_shifts: upcomingShifts,
      attendance_history: attendanceHistory,
    };

    return res.json({
      success: true,
      message: "Employee details retrieved successfully",
      data: employeeDetails,
    });
  } catch (err) {
    console.error("getEmployeeDetails error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// CREATE EMPLOYEE SHIFT
export const createEmployeeShift = async (req, res) => {
  try {
    const adminId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const {
      employee_id,
      start_date_time,
      end_date_time,
      title,
      description,
      shift_type,
      location,
      notes,
    } = req.body;

    // Validate required fields
    if (!employee_id || !start_date_time || !end_date_time) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, start date, and end date are required",
      });
    }

    // Verify employee belongs to this branch AND tenant
    const employee = await User.findOne({
      _id: employee_id,
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in your branch",
      });
    }

    // Validate dates
    const start = new Date(start_date_time);
    const end = new Date(end_date_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
    }

    // Check for overlapping shifts (add isolation key to query)
    const overlappingShift = await Shift.findOne({
      employee_id: employee_id,
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
      start_date_time: { $lt: end },
      end_date_time: { $gt: start },
    });

    if (overlappingShift) {
      return res.status(400).json({
        success: false,
        message: "Shift overlaps with existing shift",
        data: {
          overlapping_shift: {
            id: overlappingShift._id,
            start: overlappingShift.start_date_time,
            end: overlappingShift.end_date_time,
          },
        },
      });
    }

    // Create shift
    const shift = await Shift.create({
      employee_id: employee_id,
      created_by_admin_id: adminId,
      super_admin_id: tenantOwnerId, // ISOLATION: Save the owner ID
      title: title || "Scheduled Shift",
      description: description || "",
      start_date_time: start,
      end_date_time: end,
      shift_type: shift_type || "regular",
      location: location || "",
      notes: notes || "",
      status: "scheduled",
    });

    const populatedShift = await Shift.findById(shift._id)
      .populate("employee_id", "name email position")
      .populate("created_by_admin_id", "name branch_name");

    return res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data: populatedShift,
    });
  } catch (err) {
    console.error("createEmployeeShift error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET BRANCH ATTENDANCE REPORT
export const getBranchAttendanceReport = async (req, res) => {
  try {
    const adminId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { start_date, end_date, employee_id } = req.query;

    // Validate dates
    const start = start_date ? new Date(start_date) : new Date();
    const end = end_date ? new Date(end_date) : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Build query
    let attendanceQuery = {
      date: { $gte: start, $lte: end },
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
    };

    // Get all employees in branch (filter by tenant owner)
    const employees = await User.find({
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId, // ISOLATION: Filter employees by owner ID
    }).select("_id name email position");

    const employeeIds = employees.map((emp) => emp._id);

    if (employee_id) {
      // Verify employee belongs to this branch
      if (!employeeIds.some((id) => id.toString() === employee_id.toString())) {
        return res.status(403).json({
          success: false,
          message: "Employee not found in your branch",
        });
      }
      attendanceQuery.user_id = employee_id;
    } else {
      attendanceQuery.user_id = { $in: employeeIds };
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate("user_id", "name email position")
      .sort({ date: -1 });

    // Generate report summary
    const reportSummary = {
      period: {
        start_date: start,
        end_date: end,
      },
      total_employees: employees.length,
      total_records: attendanceRecords.length,
      by_status: {
        present: attendanceRecords.filter((r) => r.status === "present").length,
        late: attendanceRecords.filter((r) => r.status === "late").length,
        absent: attendanceRecords.filter((r) => r.status === "absent").length,
        half_day: attendanceRecords.filter((r) => r.status === "half_day")
          .length,
      },
      total_hours: attendanceRecords.reduce(
        (sum, r) => sum + (r.total_hours || 0),
        0
      ),
      total_overtime: attendanceRecords.reduce(
        (sum, r) => sum + (r.overtime || 0),
        0
      ),
      records: attendanceRecords,
    };

    return res.json({
      success: true,
      message: "Attendance report generated successfully",
      data: reportSummary,
    });
  } catch (err) {
    console.error("getBranchAttendanceReport error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE EMPLOYEE PROFILE
export const updateEmployeeProfile = async (req, res) => {
  try {
    const adminId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { employeeId } = req.params;
    const { name, email, phone, position, department, is_active, hourly_rate, currency } = req.body;

    // Verify employee belongs to this branch AND tenant
    const employee = await User.findOne({
      _id: employeeId,
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId, // ISOLATION: Filter by owner ID
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in your branch",
      });
    }

    // Prevent email duplication
    if (email && email !== employee.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
      employee.email = email;
    }

    // Update fields
    if (name) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (position !== undefined) employee.position = position;
    if (department !== undefined) employee.department = department;
    if (is_active !== undefined) employee.is_active = is_active;
    if (hourly_rate !== undefined) employee.hourly_rate = hourly_rate;
    if (currency !== undefined) employee.currency = currency;

    await employee.save();

    const updatedEmployee = await User.findById(employeeId).select(
      "-password -resetPasswordToken -resetPasswordExpire"
    );

    return res.json({
      success: true,
      message: "Employee profile updated successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("updateEmployeeProfile error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET BRANCH SHIFTS CALENDAR
export const getBranchShiftsCalendar = async (req, res) => {
  try {
    const adminId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { start_date, end_date } = req.query;

    // Validate dates
    const start = start_date ? new Date(start_date) : new Date();
    const end = end_date ? new Date(end_date) : new Date();
    end.setDate(end.getDate() + 7); // Default to next 7 days

    // Get all employees in branch (filter by tenant owner)
    const employees = await User.find({
      branch_admin_id: adminId,
      role: "employee",
      is_active: true,
      super_admin_id: tenantOwnerId, // ISOLATION: Filter employees by owner ID
    }).select("_id name email position");

    const employeeIds = employees.map((emp) => emp._id);

    // Get shifts for the period (filter by tenant owner)
    const shifts = await Shift.find({
      employee_id: { $in: employeeIds },
      super_admin_id: tenantOwnerId, // ISOLATION: Filter shifts by owner ID
      start_date_time: { $gte: start },
      end_date_time: { $lte: end },
    })
      .populate("employee_id", "name email position")
      .sort({ start_date_time: 1 });

    // Format for calendar view
    const calendarData = shifts.map((shift) => ({
      id: shift._id,
      title: `${shift.employee_id.name} - ${shift.title}`,
      start: shift.start_date_time,
      end: shift.end_date_time,
      employee: shift.employee_id,
      shift_type: shift.shift_type,
      status: shift.status,
      location: shift.location,
    }));

    return res.json({
      success: true,
      message: "Branch shifts calendar retrieved successfully",
      data: {
        period: { start, end },
        employees: employees,
        shifts: calendarData,
      },
    });
  } catch (err) {
    console.error("getBranchShiftsCalendar error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
  try {
    const adminId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
    const { employeeId } = req.params;

    // 1. Find the employee ensuring they belong to this branch and tenant
    const employee = await User.findOne({
      _id: employeeId,
      branch_admin_id: adminId,
      role: "employee",
      super_admin_id: tenantOwnerId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in your branch",
      });
    }

    // 2. Delete employee
    await User.findByIdAndDelete(employeeId);

    return res.json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (err) {
    console.error("deleteEmployee error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ============================================
// 📍 UPDATE BRANCH LOCATION (Geofencing)
// ============================================
export const updateBranchLocation = async (req, res) => {
  const { lat, lng, radius, address } = req.body;

  try {
    // req.user يأتي من الـ middleware
    const user = await User.findById(req.user._id);

    if (user) {
      user.branch_location = {
        lat: lat || user.branch_location.lat,
        lng: lng || user.branch_location.lng,
        radius: radius || user.branch_location.radius || 200, // Default 200m
        address: address || user.branch_location.address,
      };

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        message: "تم تحديث موقع الفرع بنجاح",
        data: updatedUser.branch_location, // إرجاع البيانات المحدثة
      });
    } else {
      res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }
  } catch (error) {
    console.error("updateBranchLocation error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};