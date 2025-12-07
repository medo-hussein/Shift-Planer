import express from "express";
import { 
  protect, 
  employeeOnly,
  adminOrAbove
} from "../middleware/authMiddleware.js";
import {
    createSwapRequest,
    getMySwapRequests,
    acceptSwapRequest,
    rejectSwapRequest,
    approveSwapRequest,
    getBranchSwapRequests
} from "../controllers/swapController.js";

const router = express.Router();

router.use(protect);

// Employee Routes
router.post("/", employeeOnly, createSwapRequest);
router.get("/", employeeOnly, getMySwapRequests);
router.put("/:id/accept", employeeOnly, acceptSwapRequest);
router.put("/:id/reject", rejectSwapRequest); // Can be used by employee (target) or admin

// Admin Routes
router.get("/admin", adminOrAbove, getBranchSwapRequests);
router.put("/:id/approve", adminOrAbove, approveSwapRequest);

export default router;