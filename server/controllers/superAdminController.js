import User from "../models/userModel.js";
import Report from "../models/reportModel.js";
import Attendance from "../models/attendanceModel.js";
import Shift from "../models/shiftModel.js";

// GET SUPER ADMIN DASHBOARD STATS (يتم فلترتها الآن بناءً على المالك)
export const getSuperAdminDashboard = async (req, res) => {
  try {
    const superAdminId = req.user._id; // ⭐ مفتاح العزل (Super Admin ID الحالي)

    // 1. الحصول على معرفات مديري الفروع (Admins) الذين يمتلكهم هذا الـ SA
    const ownedAdmins = await User.find({ 
        role: "admin", 
        super_admin_id: superAdminId 
    }).select('_id is_active');
    const ownedAdminIdsArray = ownedAdmins.map(id => id._id);

    // 2. الحصول على معرفات الموظفين (Employees) المرتبطين بمديري الفروع هؤلاء
    const ownedEmployeeIds = await User.find({ 
        role: "employee", 
        branch_admin_id: { $in: ownedAdminIdsArray } 
    }).select('_id');
    const ownedEmployeeIdsArray = ownedEmployeeIds.map(id => id._id);

    const [
      totalBranches,
      totalEmployees,
      totalShifts,
      recentAdmins,
      systemReports
    ] = await Promise.all([
      // إجمالي الفروع التي يديرها هذا الـ SA
      User.countDocuments({ 
          role: "admin", 
          super_admin_id: superAdminId 
      }), 
      
      // إجمالي الموظفين تحت إشراف الفروع المملوكة لهذا الـ SA
      User.countDocuments({ 
          role: "employee", 
          branch_admin_id: { $in: ownedAdminIdsArray } 
      }),

      // إجمالي المناوبات التي تم إنشاؤها بواسطة مديري الفروع المملوكين
      Shift.countDocuments({ 
          created_by_admin_id: { $in: ownedAdminIdsArray } 
      }),
      
      // أحدث مديري الفروع الذين يمتلكهم هذا الـ SA
      User.find({ 
          role: "admin", 
          super_admin_id: superAdminId 
      }) 
        .select('name email branch_name created_at is_active')
        .sort({ created_at: -1 })
        .limit(5),
      
      // تقارير النظام التي تم إنشاؤها بواسطة مديري الفروع المملوكين (آخر 7 أيام)
      Report.countDocuments({ 
        generated_by_admin_id: { $in: ownedAdminIdsArray }, 
        created_at: { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        }
      })
    ]);

    // حساب الفروع النشطة
    const activeBranches = ownedAdmins.filter(admin => admin.is_active).length;

    // الحصول على إجمالي سجلات الحضور للموظفين المملوكين لهذا الـ SA
    const totalAttendanceRecords = await Attendance.countDocuments({ user_id: { $in: ownedEmployeeIdsArray } }); 

    // الحصول على سجلات الحضور لهذا اليوم للموظفين المملوكين
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttendanceCount = await Attendance.countDocuments({
        user_id: { $in: ownedEmployeeIdsArray },
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
        attendance_today: todayAttendanceCount,
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
    const superAdminId = req.user._id; // ⭐ مفتاح العزل
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
      is_active: true,
      super_admin_id: superAdminId // ⭐ حفظ معرف المالك (Isolation Key)
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
        created_at: admin.createdAt,
        super_admin_id: admin.super_admin_id
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
    const superAdminId = req.user._id; // ⭐ مفتاح العزل
    const { page = 1, limit = 10, is_active, search } = req.query;

    let query = { 
        role: "admin",
        super_admin_id: superAdminId // ⭐ فلترة أساسية: جلب الفروع المملوكة فقط
    };

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

    // Get employee counts for each branch (للفروع المملوكة فقط)
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
    const superAdminId = req.user._id; // ⭐ مفتاح العزل
    const { branchId } = req.params;

    // فلترة بناءً على ID الفرع و ID المالك
    const branchAdmin = await User.findOne({
      _id: branchId,
      role: "admin",
      super_admin_id: superAdminId // ⭐ شرط الملكية
    })
    .select('-password -resetPasswordToken -resetPasswordExpire');
    
    if (!branchAdmin) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or not owned by you" 
      });
    }
    
    const branchAdminId = branchAdmin._id;

    // باقي الإحصائيات تستخدم الآن branchAdminId الذي تم التحقق من ملكيته
    const [
      totalEmployees,
      activeEmployees,
      totalShifts,
      todayAttendance
    ] = await Promise.all([
      User.countDocuments({ 
        branch_admin_id: branchAdminId, 
        role: "employee" 
      }),
      User.countDocuments({ 
        branch_admin_id: branchAdminId, 
        role: "employee",
        is_active: true 
      }),
      Shift.countDocuments({ 
        created_by_admin_id: branchAdminId 
      }),
      Attendance.countDocuments({
        user_id: { 
          $in: await User.find({ 
            branch_admin_id: branchAdminId 
          }).select('_id') 
        },
        date: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    ]);

    // Get recent employees
    const recentEmployees = await User.find({
      branch_admin_id: branchAdminId,
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
    const superAdminId = req.user._id; // ⭐ مفتاح العزل
    const { branchId } = req.params;
    const { name, email, branch_name, is_active } = req.body;

    // البحث مع شرط الملكية
    const branchAdmin = await User.findOne({
      _id: branchId,
      super_admin_id: superAdminId // ⭐ شرط الملكية
    });
    
    if (!branchAdmin || branchAdmin.role !== "admin") {
      return res.status(404).json({
        success: false,
        message: "Branch admin not found or not owned by you"
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
    const superAdminId = req.user._id; // ⭐ مفتاح العزل
    const { type, start_date, end_date, page = 1, limit = 10 } = req.query;

    // الحصول على معرفات مديري الفروع المملوكين
    const ownedAdminIds = await User.find({ role: "admin", super_admin_id: superAdminId }).select('_id');
    const ownedAdminIdsArray = ownedAdminIds.map(id => id._id);

    let query = {
        // فلترة التقارير التي تم إنشاؤها فقط من قبل مديري الفروع المملوكين
        generated_by_admin_id: { $in: ownedAdminIdsArray } 
    };

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
    const superAdminId = req.user._id; // ⭐ مفتاح العزل
    const { employeeId, newBranchAdminId } = req.body;

    if (!employeeId || !newBranchAdminId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and new branch admin ID are required"
      });
    }

    // 1. التحقق من أن المدير الجديد تابع لـ SA الحالي
    const newBranchAdmin = await User.findOne({
      _id: newBranchAdminId,
      role: "admin",
      super_admin_id: superAdminId // ⭐ التحقق من ملكية الفرع الجديد
    });
    if (!newBranchAdmin) {
      return res.status(404).json({
        success: false,
        message: "New branch admin not found or not owned by you"
      });
    }

    // 2. التحقق من أن الموظف نفسه تابع لنظام الـ SA الحالي
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== "employee") {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    // التحقق من ملكية المدير الحالي للموظف
    const currentAdmin = await User.findById(employee.branch_admin_id).select('super_admin_id');

    if (currentAdmin?.super_admin_id?.toString() !== superAdminId.toString()) {
        return res.status(403).json({
            success: false,
            message: "Employee does not belong to a system managed by you"
        });
    }

    // Update employee branch
    const oldBranchAdminId = employee.branch_admin_id;
    employee.branch_admin_id = newBranchAdminId;
    employee.super_admin_id = superAdminId; // ⭐ تحديث معرف المالك للموظف
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