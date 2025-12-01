import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Utility function to get the Super Admin ID (Tenant Owner ID)
const getTenantOwnerId = (user) => {
    // If the user is Super Admin, they are their own owner. Otherwise, use their stored Super Admin ID.
    return user.role === "super_admin" ? user._id : user.super_admin_id;
};

export const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User no longer exists" });

    if (!user.is_active) {
      return res.status(403).json({ message: "User account is inactive" });
    }

    req.user = user;
    next();

  } catch (err) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// SUPER ADMIN ONLY
export const superAdminOnly = (req, res, next) => {
  if (req.user.role !== "super_admin")
    return res.status(403).json({ message: "Super admin access required" });
  next();
};

// ADMIN ONLY (BRANCH ADMIN)
export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Branch admin access required" });
  next();
};

// EMPLOYEE ONLY
export const employeeOnly = (req, res, next) => {
  if (req.user.role !== "employee")
    return res.status(403).json({ message: "Employee access required" });
  next();
};

// ADMIN OR SUPER ADMIN
export const adminOrAbove = (req, res, next) => {
  if (!["super_admin", "admin"].includes(req.user.role))
    return res.status(403).json({ message: "Admin or super admin access required" });
  next();
};

// EMPLOYEE OR ABOVE
export const employeeOrAbove = (req, res, next) => {
  if (!["super_admin", "admin", "employee"].includes(req.user.role))
    return res.status(403).json({ message: "Authentication required" });
  next();
};

// CHECK BRANCH ACCESS - For admin/sa to access their branch resources
export const checkBranchAccess = async (req, res, next) => {
  try {
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY

    if (req.user.role === "super_admin") {
      // Super admin passes the access check here, but the controller must enforce data filtering
      return next(); 
    }

    if (req.user.role === "admin") {
      // Admin can only access their own branch data
      const resourceId = req.params.id || req.body.employee_id || req.body.branch_admin_id;
      
      if (resourceId) {
        // If accessing employee/resource by ID, check if it belongs to this admin AND tenant
        const resource = await User.findById(resourceId);
        
        if (!resource) return res.status(404).json({ message: "Resource not found" });

        // ISOLATION: Check if resource belongs to the current tenant
        if (resource.super_admin_id?.toString() !== tenantOwnerId.toString()) {
             return res.status(403).json({ message: "Access denied. Resource belongs to another system." });
        }
        
        // Local Check: Check if employee belongs to THIS admin's branch
        if (resource.role === "employee" && resource.branch_admin_id?.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: "Access denied to this branch resource" });
        }
      }
      
      return next();
    }

    if (req.user.role === "employee") {
      // Employee can only access their own data
      const resourceId = req.params.id || req.body.employee_id;
      
      if (resourceId && resourceId !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied to other employee data" });
      }
      
      return next();
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    console.error("checkBranchAccess error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// CHECK EMPLOYEE ACCESS - For employees to access only their own data
export const checkEmployeeAccess = async (req, res, next) => {
  try {
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY
      
    if (req.user.role === "super_admin" || req.user.role === "admin") {
      
      // If Super Admin/Admin is accessing an employee by ID (in URL params), enforce tenant isolation
      const employeeId = req.params.employeeId || req.params.id;

      if (employeeId) {
          const employee = await User.findById(employeeId);

          if (!employee) return res.status(404).json({ message: "Employee not found" });
          
          // ISOLATION: Check if employee belongs to the current tenant
          if (employee.super_admin_id?.toString() !== tenantOwnerId.toString()) {
              return res.status(403).json({ message: "Access denied. Employee belongs to another system." });
          }
      }

      return next(); // Admins can access owned employee data
    }

    if (req.user.role === "employee") {
      const employeeId = req.params.employeeId || req.params.id;
      
      // Employee can only access their own data
      if (employeeId && employeeId !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied to other employee data" });
      }
      
      return next();
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    console.error("checkEmployeeAccess error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// CHECK ADMIN BRANCH ACCESS - For admin to manage their branch
export const checkAdminBranchAccess = async (req, res, next) => {
  try {
    const tenantOwnerId = getTenantOwnerId(req.user); // ISOLATION KEY

    if (req.user.role === "super_admin") {
      // Super admin can access all branches owned by them
      const targetAdminId = req.params.id || req.body.admin_id;
      
      if (targetAdminId) {
          const targetAdmin = await User.findById(targetAdminId);
          if (!targetAdmin) return res.status(404).json({ message: "Admin not found" });

          // ISOLATION: Admin ID must either be the Super Admin's own ID or belong to their owned tenant
          const isOwned = targetAdmin.super_admin_id?.toString() === tenantOwnerId.toString();
          const isSelf = targetAdminId.toString() === tenantOwnerId.toString();

          if (!isOwned && !isSelf) {
              return res.status(403).json({ message: "Access denied to other branches" });
          }
      }

      return next(); 
    }

    if (req.user.role === "admin") {
      const targetAdminId = req.params.id || req.body.admin_id;
      
      // Admin can only access their own branch ID
      if (targetAdminId && targetAdminId !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied to other branches" });
      }
      
      return next();
    }

    return res.status(403).json({ message: "Admin access required" });
  } catch (error) {
    console.error("checkAdminBranchAccess error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// DYNAMIC PERMISSION CHECKER
export const requirePermission = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
};

// CHECK RESOURCE OWNERSHIP (Kept for compatibility, though largely superseded by Controller logic)
export const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === "super_admin") return next();

      const resourceId = req.params.id;
      
      switch (resourceType) {
        case 'employee':
          if (req.user.role === "admin") {
            const employee = await User.findById(resourceId);
            if (!employee || employee.branch_admin_id?.toString() !== req.user._id.toString()) {
              return res.status(403).json({ message: "Access denied to this employee" });
            }
          }
          break;

        case 'shift':
          // The main isolation check for shifts is now in shiftController.js
          break;

        case 'attendance':
          // The main isolation check for attendance is now in attendanceController.js
          break;

        default:
          break;
      }

      next();
    } catch (error) {
      console.error("checkResourceOwnership error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };
};