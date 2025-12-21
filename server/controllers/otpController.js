import OTP from "../models/otpModel.js";
import User from "../models/userModel.js";
import { sendOTPEmail } from "../utils/emailService.js";

// Generate and send OTP for email verification
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMAIL",
        message: "Please provide a valid email address",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.email_verified) {
      return res.status(400).json({
        success: false,
        error: "EMAIL_ALREADY_VERIFIED",
        message: "This email is already registered and verified",
      });
    }

    // Clean up any existing unverified OTPs for this email
    await OTP.deleteMany({
      email: email.toLowerCase(),
      type: "email_verification",
      isVerified: false,
    });

    // Generate new OTP
    const otpCode = OTP.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create OTP record
    const otpRecord = await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      type: "email_verification",
      expiresAt: expiresAt,
    });

    // Send OTP via email
    await sendOTPEmail(email, otpCode, "email_verification");

    return res.status(201).json({
      success: true,
      message: "OTP sent successfully. Please check your email.",
      data: {
        email: email,
        expires_at: expiresAt,
      },
      // In development, you might want to return the OTP for testing
      ...(process.env.NODE_ENV === "development" && { otp: otpCode }),
    });
  } catch (error) {
    console.error("sendOTP error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to send OTP. Please try again later.",
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "Email and OTP are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMAIL",
        message: "Please provide a valid email address",
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_OTP_FORMAT",
        message: "OTP must be 6 digits",
      });
    }

    // Find valid OTP
    const otpRecord = await OTP.findValidOTP(
      email.toLowerCase(),
      otp,
      "email_verification"
    );

    if (!otpRecord) {
      // ⭐ زيادة attempts إذا OTP غلط
      const failedOTP = await OTP.findOne({
        email: email.toLowerCase(),
        type: "email_verification",
        isVerified: false,
      });

      if (failedOTP) {
        await failedOTP.incrementAttempts();
      }

      return res.status(400).json({
        success: false,
        error: "INVALID_OTP",
        message: "Invalid or expired OTP",
      });
    }

    // Check if max attempts reached
    if (otpRecord.isMaxAttemptsReached()) {
      return res.status(429).json({
        success: false,
        error: "MAX_ATTEMPTS_REACHED",
        message: "Maximum attempts reached. Please request a new OTP.",
      });
    }

    // Mark OTP as verified
    await otpRecord.markAsVerified();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      user.email_verified = true;
      user.is_active = true;
      await user.save();
    }

    return res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        email_verified: true,
        user_id: user?._id,
        email: email,
      },
    });
  } catch (error) {
    console.error("verifyOTP error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to verify OTP. Please try again later.",
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMAIL",
        message: "Please provide a valid email address",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.email_verified) {
      return res.status(400).json({
        success: false,
        error: "ALREADY_VERIFIED",
        message: "Email is already verified",
      });
    }

    const recentOTP = await OTP.findOne({
      email: email.toLowerCase(),
      type: "email_verification",
      isVerified: false,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        error: "RESEND_LIMIT",
        message: "Please wait 1 minute before requesting a new OTP",
      });
    }

    // Clean up old unverified OTPs
    await OTP.deleteMany({
      email: email.toLowerCase(),
      type: "email_verification",
      isVerified: false,
    });

    // Generate new OTP
    const otpCode = OTP.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new OTP record
    const otpRecord = await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      type: "email_verification",
      expiresAt: expiresAt,
    });

    // Send OTP via email
    await sendOTPEmail(email, otpCode, "email_verification");

    return res.json({
      success: true,
      message: "OTP resent successfully. Please check your email.",
      data: {
        email: email,
        expires_at: expiresAt,
      },
      // In development, you might want to return the OTP for testing
      ...(process.env.NODE_ENV === "development" && { otp: otpCode }),
    });
  } catch (error) {
    console.error("resendOTP error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to resend OTP. Please try again later.",
    });
  }
};

// Check email verification status
export const checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.params;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMAIL",
        message: "Please provide a valid email address",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    return res.json({
      success: true,
      data: {
        email: email,
        email_verified: user ? user.email_verified : false,
        user_exists: !!user,
        is_active: user ? user.is_active : false,
      },
    });
  } catch (error) {
    console.error("checkVerificationStatus error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to check verification status",
    });
  }
};

// Clean up expired OTPs (utility function, can be called by cron job)
export const cleanupExpiredOTPs = async (req, res) => {
  try {
    const result = await OTP.cleanupExpired();

    return res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} expired OTPs`,
      data: {
        deleted_count: result.deletedCount,
      },
    });
  } catch (error) {
    console.error("cleanupExpiredOTPs error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to cleanup expired OTPs",
    });
  }
};
