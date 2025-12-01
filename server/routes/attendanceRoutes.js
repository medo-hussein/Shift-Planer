import express from "express";
import { 
  protect, 
  employeeOnly, 
  adminOnly, 
  adminOrAbove,
  checkEmployeeAccess 
} from "../middleware/authMiddleware.js";
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getMyAttendance,
  getBranchAttendance,
  getAttendanceSummary,
  getEmployeeAttendance
} from "../controllers/attendanceController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee only routes
router.post("/clock-in", employeeOnly, clockIn);
router.post("/clock-out", employeeOnly, clockOut);
router.post("/break/start", employeeOnly, startBreak);
router.post("/break/end", employeeOnly, endBreak);
router.get("/my-attendance", employeeOnly, getMyAttendance);
router.get("/my-summary", employeeOnly, getAttendanceSummary);

// Admin only routes (branch attendance management)
router.get("/branch", adminOnly, getBranchAttendance);
router.get("/employee/:employeeId", adminOnly, checkEmployeeAccess, getEmployeeAttendance);

export default router;