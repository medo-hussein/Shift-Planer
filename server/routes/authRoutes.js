import express from "express";
import {
  registerSuperAdmin,
  createAdmin,
  loginUser,
  refreshAccessToken,
  logoutUser,
  forgetPassword,
  resetPassword,
  getMyProfile,
  updateMyProfile,
  verifyEmail,
  resendOTP
} from "../controllers/authController.js";
import { protect, superAdminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/register-super-admin", registerSuperAdmin); // First-time setup
router.post("/login", loginUser);
router.get("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);

// Email verification routes (public)
router.post("/verify-email", verifyEmail);           // Verify email with OTP
router.post("/resend-verification", resendOTP);      // Resend verification OTP

// Protected routes (authentication required)
router.use(protect); // All routes below this require authentication

router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

// Super Admin only routes
router.post("/create-admin", superAdminOnly, createAdmin); // Super admin creates branch admin

export default router;