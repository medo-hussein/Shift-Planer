import express from "express";
import { 
  protect, 
  employeeOnly, 
  adminOnly, 
  adminOrAbove,
  superAdminOnly 
} from "../middleware/authMiddleware.js";
import {
  generateAttendanceReport,
  generateShiftReport,
  generatePerformanceReport,
  getReports,
  getReportById,
  shareReport,
  deleteReport,
  getDashboardStats,
  generateAIAnalysis // Added import for AI analysis
} from "../controllers/reportController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Report generation routes (Admin and Super Admin only)
router.post("/attendance", adminOrAbove, generateAttendanceReport);
router.post("/shift", adminOrAbove, generateShiftReport);
router.post("/performance", adminOrAbove, generatePerformanceReport);

// New Route: Generate AI Analysis for a report
router.post("/:id/analyze", generateAIAnalysis);

// Report sharing and management (Admin and Super Admin only)
router.post("/:id/share", adminOrAbove, shareReport);
router.delete("/:id", adminOrAbove, deleteReport);

// Report access routes (all authenticated users with permissions)
router.get("/", getReports); // Users see reports they have access to
router.get("/dashboard-stats", getDashboardStats); // Role-specific dashboard stats
router.get("/:id", getReportById); // Access control handled in controller

export default router;