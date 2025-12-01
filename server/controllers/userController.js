import User from "../models/userModel.js";

// GET ALL ADMINS (BRANCHES) - Super Admin only
export const getAdmins = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Super admin access required" });
    }

    const admins = await User.find({ role: "admin" })
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: admins,
      total: admins.length
    });
  } catch (err) {
    console.error("getAdmins error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET BRANCH EMPLOYEES - Admin only
export const getBranchEmployees = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    let query = { role: "employee" };

    // Admin can only see their own branch employees
    if (userRole === "admin") {
      query.branch_admin_id = adminId;
    }

    // Super admin can filter by branch
    if (userRole === "super_admin" && req.query.branch_admin_id) {
      query.branch_admin_id = req.query.branch_admin_id;
    }

    const employees = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('branch_admin_id', 'name branch_name')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: employees,
      total: employees.length
    });
  } catch (err) {
    console.error("getBranchEmployees error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// CREATE EMPLOYEE - Admin only
export const createEmployee = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, email, password, phone, position, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Name, email and password are required" 
      });
    }

    // Prevent duplicate emails
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: "Email already exists" 
      });
    }

    // Determine branch_admin_id
    let branch_admin_id = adminId;
    
    // Super admin can specify which branch to add employee to
    if (userRole === "super_admin" && req.body.branch_admin_id) {
      const targetAdmin = await User.findOne({
        _id: req.body.branch_admin_id,
        role: "admin"
      });
      
      if (!targetAdmin) {
        return res.status(404).json({ 
          success: false,
          message: "Branch admin not found" 
        });
      }
      branch_admin_id = req.body.branch_admin_id;
    }

    const newEmployee = await User.create({
      name,
      email,
      password,
      role: "employee",
      branch_admin_id,
      phone: phone || "",
      position: position || "",
      department: department || "",
      is_active: true,
    });

    // Get branch admin info for response
    const branchAdmin = await User.findById(branch_admin_id).select('name branch_name');

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        id: newEmployee._id,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        phone: newEmployee.phone,
        position: newEmployee.position,
        department: newEmployee.department,
        is_active: newEmployee.is_active,
        branch_admin: {
          id: branchAdmin._id,
          name: branchAdmin.name,
          branch_name: branchAdmin.branch_name
        },
        created_at: newEmployee.createdAt
      }
    });
  } catch (err) {
    console.error("createEmployee error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET MY PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpire');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    let profileData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      position: user.position,
      department: user.department,
      is_active: user.is_active,
      lastLogin: user.lastLogin,
      created_at: user.createdAt
    };

    // Add branch info for admin
    if (user.role === "admin") {
      profileData.branch_name = user.branch_name;
    }

    // Add branch info for employee
    if (user.role === "employee") {
      const admin = await user.getBranchAdmin();
      profileData.branch_name = admin?.branch_name;
      profileData.branch_admin_name = admin?.name;
    }

    return res.json({
      success: true,
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
    const { name, phone, position, department } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    
    // Position and department can be updated by employees and admins
    if (position !== undefined && user.role !== "super_admin") {
      user.position = position;
    }
    
    if (department !== undefined && user.role !== "super_admin") {
      user.department = department;
    }

    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// UPDATE USER - Admin only
export const updateUser = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;
    const { name, email, phone, position, department } = req.body;

    // Check permissions
    const isOwner = id === req.user._id.toString();
    const isAdmin = ["super_admin", "admin"].includes(userRole);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this user" 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check branch permissions for admin
    if (userRole === "admin" && user.role === "employee") {
      if (user.branch_admin_id?.toString() !== adminId.toString()) {
        return res.status(403).json({ 
          success: false,
          message: "Not authorized to update this employee" 
        });
      }
    }

    // Prevent email duplication
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ 
          success: false,
          message: "Email already exists" 
        });
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    
    // Only update position/department for employees
    if (user.role === "employee") {
      if (position !== undefined) user.position = position;
      if (department !== undefined) user.department = department;
    }

    await user.save();

    const updatedUser = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('branch_admin_id', 'name branch_name');

    return res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser
    });
  } catch (err) {
    console.error("updateUser error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// DEACTIVATE/ACTIVATE USER - Admin only
export const toggleUserStatus = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;
    const { is_active } = req.body;

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Admin access required" 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check permissions
    if (userRole === "admin") {
      if (user.role === "employee" && user.branch_admin_id?.toString() !== adminId.toString()) {
        return res.status(403).json({ 
          success: false,
          message: "Not authorized to update this employee" 
        });
      }
      
      // Admin cannot deactivate themselves or other admins
      if (id === adminId.toString() || user.role === "admin") {
        return res.status(403).json({ 
          success: false,
          message: "Not authorized to update admin accounts" 
        });
      }
    }

    // Prevent deactivating yourself (super admin)
    if (id === adminId.toString() && userRole === "super_admin") {
      return res.status(400).json({ 
        success: false,
        message: "Cannot deactivate your own account" 
      });
    }

    user.is_active = is_active !== undefined ? is_active : !user.is_active;
    await user.save();

    return res.json({
      success: true,
      message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (err) {
    console.error("toggleUserStatus error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('branch_admin_id', 'name branch_name');
      
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check permissions
    const isOwner = id === req.user._id.toString();
    const isAdmin = ["super_admin", "admin"].includes(userRole);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view this user" 
      });
    }

    // Check branch permissions for admin
    if (userRole === "admin" && user.role === "employee") {
      if (user.branch_admin_id?._id.toString() !== adminId.toString()) {
        return res.status(403).json({ 
          success: false,
          message: "Not authorized to view this employee" 
        });
      }
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error("getUserById error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// DELETE USER - Super Admin only
export const deleteUser = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { id } = req.params;

    if (userRole !== "super_admin") {
      return res.status(403).json({ 
        success: false,
        message: "Super admin access required" 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Prevent deleting yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot delete your own account" 
      });
    }

    await User.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};