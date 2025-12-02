import express from "express";
import { 
  protect, 
  employeeOnly 
} from "../middleware/authMiddleware.js";
import {
  getEmployeeDashboard,
  getMyShifts,
  getMyAttendance,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getMyProfile,
  updateMyProfile,
  getTodayStatus,
  getMyReports
} from "../controllers/employeeController.js";

import { createLeaveRequest, getMyLeaveRequests } from "../controllers/leaveRequestController.js"; 
import { getTodayShifts } from "../controllers/shiftController.js";

const router = express.Router();

// All routes require employee authentication
router.use(protect, employeeOnly);

// Dashboard
router.get("/dashboard", getEmployeeDashboard);

// Profile management
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

// Attendance
router.get("/attendance", getMyAttendance);
router.get("/attendance/today-status", getTodayStatus);
router.post("/attendance/clock-in", clockIn);
router.post("/attendance/clock-out", clockOut);
router.post("/attendance/break/start", startBreak);
router.post("/attendance/break/end", endBreak);

// Shifts
router.get("/shifts", getMyShifts);
router.get("/shifts/today", getTodayShifts);

// Reports
router.get("/reports", getMyReports);

router.post("/leave-requests", createLeaveRequest); 
router.get("/leave-requests/me", getMyLeaveRequests);

export default router;