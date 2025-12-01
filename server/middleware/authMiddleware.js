import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

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

// CHECK BRANCH ACCESS - For admin to access their branch resources
export const checkBranchAccess = async (req, res, next) => {
  try {
    if (req.user.role === "super_admin") {
      return next(); // Super admin can access everything
    }

    if (req.user.role === "admin") {
      // Admin can only access their own branch data
      const resourceId = req.params.id || req.body.employee_id || req.body.branch_admin_id;
      
      if (resourceId) {
        // If accessing employee, check if employee belongs to this admin
        const employee = await User.findById(resourceId);
        if (employee && employee.branch_admin_id?.toString() !== req.user._id.toString()) {
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
    if (req.user.role === "super_admin" || req.user.role === "admin") {
      return next(); // Admins can access employee data
    }

    if (req.user.role === "employee") {
      const employeeId = req.params.id || req.body.employee_id;
      
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
    if (req.user.role === "super_admin") {
      return next(); // Super admin can access all branches
    }

    if (req.user.role === "admin") {
      const targetAdminId = req.params.id || req.body.admin_id;
      
      // Admin can only access their own branch
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

// CHECK RESOURCE OWNERSHIP
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
          // Implementation would check if shift belongs to admin's branch
          break;

        case 'attendance':
          // Implementation would check if attendance record belongs to admin's branch
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