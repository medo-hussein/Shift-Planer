import User from "../models/userModel.js";
import Report from "../models/reportModel.js";
import Attendance from "../models/attendanceModel.js";
import Shift from "../models/shiftModel.js";

// GET SUPER ADMIN DASHBOARD STATS
export const getSuperAdminDashboard = async (req, res) => {
  try {
    // Get system-wide statistics
    const [
      totalBranches,
      totalEmployees,
      totalShifts,
      totalAttendanceRecords,
      recentAdmins,
      systemReports
    ] = await Promise.all([
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "employee" }),
      Shift.countDocuments(),
      Attendance.countDocuments(),
      User.find({ role: "admin" })
        .select('name email branch_name created_at is_active')
        .sort({ created_at: -1 })
        .limit(5),
      Report.countDocuments({ 
        created_at: { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      })
    ]);

    // Calculate active branches
    const activeBranches = await User.countDocuments({ 
      role: "admin", 
      is_active: true 
    });

    // Get today's attendance summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today }
    });

    const stats = {
      overview: {
        total_branches: totalBranches,
        active_branches: activeBranches,
        total_employees: totalEmployees,
        total_shifts: totalShifts,
        total_attendance_records: totalAttendanceRecords
      },
      today: {
        attendance_today: todayAttendance,
        reports_generated_today: systemReports
      },
      recent_branches: recentAdmins
    };

    return res.json({
      success: true,
      message: "Super admin dashboard data retrieved successfully",
      data: stats
    });
  } catch (err) {
    console.error("getSuperAdminDashboard error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// CREATE BRANCH ADMIN
export const createBranchAdmin = async (req, res) => {
  try {
    const { name, email, password, branch_name } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Generate branch name if not provided
    const finalBranchName = branch_name || User.generateBranchName(name);

    // Create branch admin
    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      branch_name: finalBranchName,
      is_active: true
    });

    return res.status(201).json({
      success: true,
      message: "Branch admin created successfully",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        branch_name: admin.branch_name,
        role: admin.role,
        is_active: admin.is_active,
        created_at: admin.createdAt
      }
    });
  } catch (err) {
    console.error("createBranchAdmin error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET ALL BRANCHES (ADMINS)
export const getAllBranches = async (req, res) => {
  try {
    const { page = 1, limit = 10, is_active, search } = req.query;

    let query = { role: "admin" };

    // Add filters
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { branch_name: { $regex: search, $options: 'i' } }
      ];
    }

    const admins = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get employee counts for each branch
    const branchesWithStats = await Promise.all(
      admins.map(async (admin) => {
        const employeeCount = await User.countDocuments({
          branch_admin_id: admin._id,
          role: "employee"
        });

        const activeEmployeeCount = await User.countDocuments({
          branch_admin_id: admin._id,
          role: "employee",
          is_active: true
        });

        return {
          ...admin.toObject(),
          employee_count: employeeCount,
          active_employee_count: activeEmployeeCount
        };
      })
    );

    return res.json({
      success: true,
      data: branchesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("getAllBranches error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET BRANCH DETAILS
export const getBranchDetails = async (req, res) => {
  try {
    const { branchId } = req.params;

    const branchAdmin = await User.findById(branchId)
      .select('-password -resetPasswordToken -resetPasswordExpire');
    
    if (!branchAdmin || branchAdmin.role !== "admin") {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
      });
    }

    // Get branch statistics
    const [
      totalEmployees,
      activeEmployees,
      totalShifts,
      todayAttendance
    ] = await Promise.all([
      User.countDocuments({ 
        branch_admin_id: branchId, 
        role: "employee" 
      }),
      User.countDocuments({ 
        branch_admin_id: branchId, 
        role: "employee",
        is_active: true 
      }),
      Shift.countDocuments({ 
        created_by_admin_id: branchId 
      }),
      Attendance.countDocuments({
        user_id: { 
          $in: await User.find({ 
            branch_admin_id: branchId 
          }).select('_id') 
        },
        date: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    ]);

    // Get recent employees
    const recentEmployees = await User.find({
      branch_admin_id: branchId,
      role: "employee"
    })
    .select('name email position is_active created_at')
    .sort({ created_at: -1 })
    .limit(5);

    const branchDetails = {
      admin: branchAdmin,
      statistics: {
        total_employees: totalEmployees,
        active_employees: activeEmployees,
        total_shifts: totalShifts,
        today_attendance: todayAttendance
      },
      recent_employees: recentEmployees
    };

    return res.json({
      success: true,
      message: "Branch details retrieved successfully",
      data: branchDetails
    });
  } catch (err) {
    console.error("getBranchDetails error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// UPDATE BRANCH ADMIN
export const updateBranchAdmin = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name, email, branch_name, is_active } = req.body;

    const branchAdmin = await User.findById(branchId);
    
    if (!branchAdmin || branchAdmin.role !== "admin") {
      return res.status(404).json({
        success: false,
        message: "Branch admin not found"
      });
    }

    // Prevent email duplication
    if (email && email !== branchAdmin.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
      branchAdmin.email = email;
    }

    // Update fields
    if (name) branchAdmin.name = name;
    if (branch_name) branchAdmin.branch_name = branch_name;
    if (is_active !== undefined) branchAdmin.is_active = is_active;

    await branchAdmin.save();

    const updatedAdmin = await User.findById(branchId)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    return res.json({
      success: true,
      message: "Branch admin updated successfully",
      data: updatedAdmin
    });
  } catch (err) {
    console.error("updateBranchAdmin error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET SYSTEM REPORTS
export const getSystemReports = async (req, res) => {
  try {
    const { type, start_date, end_date, page = 1, limit = 10 } = req.query;

    let query = {};

    // Add filters
    if (type) query.type = type;

    if (start_date && end_date) {
      query.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const reports = await Report.find(query)
      .populate('generated_by_admin_id', 'name branch_name')
      .populate('employee_id', 'name email position')
      .sort({ created_at: -1 })
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
    console.error("getSystemReports error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// TRANSFER EMPLOYEE BETWEEN BRANCHES
export const transferEmployee = async (req, res) => {
  try {
    const { employeeId, newBranchAdminId } = req.body;

    if (!employeeId || !newBranchAdminId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and new branch admin ID are required"
      });
    }

    // Check employee exists
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check new branch admin exists
    const newBranchAdmin = await User.findById(newBranchAdminId);
    if (!newBranchAdmin || newBranchAdmin.role !== "admin") {
      return res.status(404).json({
        success: false,
        message: "Branch admin not found"
      });
    }

    // Update employee branch
    const oldBranchAdminId = employee.branch_admin_id;
    employee.branch_admin_id = newBranchAdminId;
    await employee.save();

    const updatedEmployee = await User.findById(employeeId)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('branch_admin_id', 'name branch_name');

    return res.json({
      success: true,
      message: "Employee transferred successfully",
      data: {
        employee: updatedEmployee,
        previous_branch: oldBranchAdminId,
        new_branch: newBranchAdminId
      }
    });
  } catch (err) {
    console.error("transferEmployee error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};