import express from "express";
import {
  sendOTP,
  verifyOTP,
  resendOTP,
  checkVerificationStatus,
  cleanupExpiredOTPs
} from "../controllers/otpController.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/send", sendOTP);                     // Send OTP to email
router.post("/verify", verifyOTP);                  // Verify OTP code
router.post("/resend", resendOTP);                  // Resend OTP
router.get("/status/:email", checkVerificationStatus); // Check verification status

// Admin/Utility routes (require authentication)
router.post("/cleanup", cleanupExpiredOTPs);        // Clean up expired OTPs

export default router;
