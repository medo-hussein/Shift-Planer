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
import {
  getGoogleAuthUrlController,
  googleAuthCallbackController,
  googleSignInController,
  linkGoogleAccountController,
  unlinkGoogleAccountController,
  getGoogleAuthStatusController
} from "../controllers/googleAuthController.js";


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

// Google OAuth routes (public, no auth required)
router.get("/google/url", getGoogleAuthUrlController);
router.get("/google/callback", googleAuthCallbackController);
router.post("/google/signin", googleSignInController);

// Google account management routes (protected)
router.post("/google/link", protect, linkGoogleAccountController);
router.post("/google/unlink", protect, unlinkGoogleAccountController);
router.get("/google/status", protect, getGoogleAuthStatusController);

export default router;
