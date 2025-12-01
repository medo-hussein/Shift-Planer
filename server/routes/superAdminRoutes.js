import express from "express";
import { protect, superAdminOnly } from "../middleware/authMiddleware.js";
import {
  getSuperAdminDashboard,
  createBranchAdmin,
  getAllBranches,
  getBranchDetails,
  updateBranchAdmin,
  getSystemReports,
  transferEmployee
} from "../controllers/superAdminController.js";

const router = express.Router();

// All routes require super admin authentication
router.use(protect, superAdminOnly);

// Dashboard and overview
router.get("/dashboard", getSuperAdminDashboard);

// Branch management
router.get("/branches", getAllBranches);
router.post("/branches", createBranchAdmin);
router.get("/branches/:branchId", getBranchDetails);
router.put("/branches/:branchId", updateBranchAdmin);

// Employee management
router.post("/employees/transfer", transferEmployee);

// System reports
router.get("/reports/system", getSystemReports);

export default router;