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

import { getApprovalRequests, updateRequestStatus } from "../controllers/leaveRequestController.js"; 

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

router.get("/leave-requests", getApprovalRequests);
router.patch("/leave-requests/:id/status", updateRequestStatus);

export default router;