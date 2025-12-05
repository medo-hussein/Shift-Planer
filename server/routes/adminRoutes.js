import express from "express";
import { 
  protect, 
  adminOnly 
} from "../middleware/authMiddleware.js";
import {
  getAdminDashboard,
  getBranchEmployees,
  getEmployeeDetails,
  createEmployeeShift,
  getBranchAttendanceReport,
  updateEmployeeProfile,
  getBranchShiftsCalendar,
  deleteEmployee 
} from "../controllers/adminController.js";

import {
  getBranchAttendance,
  getEmployeeAttendance
} from "../controllers/attendanceController.js";

import {
  getBranchShifts,
  createShift,
  createBulkShifts,
  updateShift,
  deleteShift
} from "../controllers/shiftController.js";

import {
  generateAttendanceReport,
  generateShiftReport,
  generatePerformanceReport,
  getReports,
  shareReport,
  deleteReport,
  getDashboardStats,
  generateAIAnalysis // ✅ 1. تم إضافة استيراد الدالة هنا
} from "../controllers/reportController.js";

import { createEmployee } from "../controllers/userController.js";

import { 
    createLeaveRequest, 
    getApprovalRequests, 
    updateRequestStatus,
    getMyLeaveRequests
} from "../controllers/leaveRequestController.js";

const router = express.Router();

// All routes require admin authentication
router.use(protect, adminOnly);

// Dashboard
router.get("/dashboard", getAdminDashboard);

// Employee management
router.get("/employees", getBranchEmployees);
router.post("/employees", createEmployee);
router.get("/employees/:employeeId", getEmployeeDetails);
router.put("/employees/:employeeId", updateEmployeeProfile);
router.delete("/employees/:employeeId", deleteEmployee);

// Attendance management
router.get("/attendance", getBranchAttendance);
router.get("/attendance/employee/:employeeId", getEmployeeAttendance);
router.get("/attendance/report", getBranchAttendanceReport);

// Shift management
router.get("/shifts", getBranchShifts);
router.get("/shifts/calendar", getBranchShiftsCalendar);
router.post("/shifts", createShift);
router.post("/shifts/bulk", createBulkShifts);
router.put("/shifts/:id", updateShift);
router.delete("/shifts/:id", deleteShift);

// Leave Management
router.post("/leave-requests/submit", createLeaveRequest);
router.get("/leave-requests", getApprovalRequests);           
router.patch("/leave-requests/:id/status", updateRequestStatus); 
router.get("/leave-requests/me", getMyLeaveRequests);

// Report management
router.get("/reports", getReports);
router.get("/reports/dashboard-stats", getDashboardStats);
router.post("/reports/attendance", generateAttendanceReport);
router.post("/reports/shift", generateShiftReport);
router.post("/reports/performance", generatePerformanceReport);
router.post("/reports/:id/share", shareReport);
router.delete("/reports/:id", deleteReport);

router.post("/reports/:id/analyze", generateAIAnalysis);

export default router;