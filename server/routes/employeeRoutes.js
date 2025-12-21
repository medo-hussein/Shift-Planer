import express from "express";
import {
  protect,
  employeeOnly
} from "../middleware/authMiddleware.js";

import {
  getEmployeeDashboard,
  getMyShifts,
  getMyAttendance,
  getMyProfile,
  updateMyProfile,
  getTodayStatus,
  getMyReports,
  getColleagues,
  getColleagueShifts,
  getMyPayslip
} from "../controllers/employeeController.js";

import {
  clockIn,
  clockOut,
  startBreak,
  endBreak
} from "../controllers/attendanceController.js";

import { createLeaveRequest, getMyLeaveRequests, cancelLeaveRequest } from "../controllers/leaveRequestController.js";
import { getTodayShifts } from "../controllers/shiftController.js";

const router = express.Router();

// All routes require employee authentication
router.use(protect, employeeOnly);

// Dashboard
router.get("/dashboard", getEmployeeDashboard);

// Profile management
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

// Colleagues (For Swap Requests)
router.get("/colleagues", getColleagues);
router.get("/colleagues/:colleagueId/shifts", getColleagueShifts);

// Attendance
router.get("/attendance", getMyAttendance);
router.get("/attendance/today-status", getTodayStatus);

// attendanceController ...Geofencing
router.post("/attendance/clock-in", clockIn);
router.post("/attendance/clock-out", clockOut);
router.post("/attendance/break/start", startBreak);
router.post("/attendance/break/end", endBreak);

// Shifts
router.get("/shifts", getMyShifts);
router.get("/shifts/today", getTodayShifts);

// Reports
router.get("/reports", getMyReports);

// Payslip
router.get("/payslip", getMyPayslip);

// Leave Requests
router.post("/leave-requests", createLeaveRequest);
router.get("/leave-requests/me", getMyLeaveRequests);
router.patch("/leave-requests/:id/cancel", cancelLeaveRequest);

export default router;