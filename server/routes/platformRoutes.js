import express from "express";
import {
  getPlatformDashboard,
  getAllCompanies,
  toggleCompanyStatus,
  getCompanyDetails
} from "../controllers/platformController.js";
import { protect, platformOwnerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(platformOwnerOnly);

router.get("/dashboard", getPlatformDashboard);
router.get("/companies", getAllCompanies);
router.get("/companies/:id", getCompanyDetails); // 💰 New Route
router.patch("/companies/:id/status", toggleCompanyStatus);

export default router;
