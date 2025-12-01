import express from "express";
import { 
  protect, 
  employeeOnly, 
  adminOnly,
  adminOrAbove,
  checkBranchAccess 
} from "../middleware/authMiddleware.js";
import {
  createShift,
  getBranchShifts,
  getMyShifts,
  getTodayShifts,
  updateShift,
  deleteShift,
  createBulkShifts
} from "../controllers/shiftController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee only routes
router.get("/me", employeeOnly, getMyShifts);
router.get("/today", employeeOnly, getTodayShifts);

// Admin only routes (branch shift management)
router.post("/", adminOnly, createShift);
router.post("/bulk", adminOnly, createBulkShifts);
router.get("/branch", adminOnly, getBranchShifts);
router.put("/:id", adminOnly, updateShift);
router.delete("/:id", adminOnly, deleteShift);

export default router;