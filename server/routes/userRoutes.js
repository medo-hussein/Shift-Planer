import express from "express";
import { 
  protect, 
  superAdminOnly, 
  adminOnly, 
  adminOrAbove,
  checkBranchAccess,
  checkEmployeeAccess 
} from "../middleware/authMiddleware.js";
import { 
  getAdmins,
  getBranchEmployees,
  createEmployee, 
  getMyProfile, 
  updateMyProfile,
  updateUser, 
  toggleUserStatus,
  getUserById,
  deleteUser
} from "../controllers/userController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User profile routes (accessible to all roles)
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);

// Super Admin routes
router.get("/admins", superAdminOnly, getAdmins);
router.delete("/:id", superAdminOnly, deleteUser);

// Admin routes (branch management)
router.get("/branch/employees", adminOnly, getBranchEmployees);
router.post("/employees", adminOnly, createEmployee);
router.get("/employees/:employeeId", adminOnly, checkEmployeeAccess, getUserById);
router.put("/employees/:employeeId", adminOnly, checkEmployeeAccess, updateUser);
router.patch("/employees/:id/status", adminOnly, checkEmployeeAccess, toggleUserStatus);
// General user routes (with branch access control)
router.get("/:id", checkBranchAccess, getUserById);
router.put("/:id", checkBranchAccess, updateUser);

export default router;