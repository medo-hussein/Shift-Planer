import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.js";
import { sendResetPasswordEmail, sendOTPEmail } from "../utils/emailService.js";

// REGISTER SUPER ADMIN (First Setup) - With OTP Verification
export const registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMAIL",
        message: "Please provide a valid email address"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "WEAK_PASSWORD",
        message: "Password must be at least 6 characters long"
      });
    }

    if (!companyName || companyName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "INVALID_COMPANY_NAME",
        message: "Company name must be at least 2 characters long"
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        error: "EMAIL_EXISTS",
        message: "Email already in use"
      });
    }

    // Create company first
    const Company = await import("../models/companyModel.js");
    const company = await Company.default.create({ name: companyName.trim() });

    const superAdmin = await User.create({
      name,
      email,
      password,
      role: "super_admin",
      is_active: false,
      company: company._id,
      email_verified: false
    });

    const otpCode = OTP.generateOTP();

    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      type: "email_verification",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOTPEmail(email, otpCode, "email_verification");

    return res.status(201).json({
      success: true,
      message: "Super Admin registered successfully! Please check your email.",
      data: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        email_verified: superAdmin.email_verified,
        is_active: superAdmin.is_active,
        company: {
          id: company._id,
          name: company.name
        }
      }
    });
  } catch (err) {
    console.error("registerSuperAdmin error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Registration failed. Please try again later."
    });
  }
};

// VERIFY EMAIL WITH OTP
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "Email and OTP are required"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMAIL",
        message: "Please provide a valid email address"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found"
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: "ALREADY_VERIFIED",
        message: "Email is already verified"
      });
    }

    const otpRecord = await OTP.findValidOTP(email.toLowerCase(), otp, "email_verification");

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: "INVALID_OTP",
        message: "Invalid or expired OTP"
      });
    }

    await otpRecord.markAsVerified();

    user.email_verified = true;
    user.is_active = true;
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.json({
      success: true,
      message: "Email verified successfully!",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        is_active: user.is_active
      }
    });

  } catch (err) {
    console.error("verifyEmail error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Email verification failed."
    });
  }
};

// RESEND OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "MISSING_EMAIL",
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found"
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: "ALREADY_VERIFIED",
        message: "Email is already verified"
      });
    }

    await OTP.updateMany(
      {
        email: email.toLowerCase(),
        type: "email_verification",
        isVerified: false
      },
      { expiresAt: Date.now() }
    );

    const otpCode = OTP.generateOTP();

    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      type: "email_verification",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOTPEmail(email, otpCode, "email_verification");

    return res.json({
      success: true,
      message: "OTP sent successfully.",
      data: {
        email: email,
        expires_in: "10 minutes"
      }
    });
  } catch (err) {
    console.error("resendOTP error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to resend OTP."
    });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid credentials"
      });
    }

    if (user.role === "superAdmin" && !user.email_verified) {
      return res.status(403).json({
        success: false,
        error: "EMAIL_NOT_VERIFIED",
        message: "Verify email before logging in"
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: "ACCOUNT_INACTIVE",
        message: "Account inactive"
      });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(400).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid credentials"
      });
    }

    await user.updateLastLogin();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    let userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      is_active: user.is_active,
      lastLogin: user.lastLogin
    };

    if (user.role === "admin") {
      userResponse.branch_name = user.branch_name;
    }

    if (user.role === "employee") {
      const admin = await user.getBranchAdmin();
      userResponse.branch_name = admin?.branch_name;
      userResponse.branch_admin_name = admin?.name;
    }

    return res.json({
      success: true,
      message: "Logged in successfully",
      accessToken,
      user: userResponse,
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: err.message
    });
  }
};

// REFRESH TOKEN
export const refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "User account is inactive" });
    }

    const newAccessToken = generateAccessToken(user);

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("refreshAccessToken error:", err);
    return res.status(401).json({ message: "Refresh token expired or invalid" });
  }
};

// LOGOUT
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("logoutUser error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// FORGET PASSWORD
export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If the email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    await sendResetPasswordEmail(user.email, resetUrl);

    return res.json({ message: "Reset email sent." });
  } catch (err) {
    console.error("forgetPassword error:", err);
    return res.status(500).json({ message: "Email could not be sent." });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profileData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      position: user.position,
      department: user.department,
      hireDate: user.hireDate,
      avatar: user.avatar,
      is_active: user.is_active,
      email_verified: user.email_verified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    if (user.role === "admin") {
      profileData.branch_name = user.branch_name;
    }

    if (user.role === "employee") {
      const admin = await user.getBranchAdmin();
      profileData.branch_name = admin?.branch_name;
      profileData.branch_admin_name = admin?.name;
      profileData.branch_admin_email = admin?.email;
    }

    res.json(profileData);
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// UPDATE PROFILE
export const updateMyProfile = async (req, res) => {
  try {
    // ✅ التعديل: إضافة avatar هنا
    const { name, phone, position, department, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    // ✅ التعديل: تحديث الصورة
    if (avatar) user.avatar = avatar;

    if (position && user.role !== "super_admin") user.position = position;
    if (department && user.role !== "super_admin") user.department = department;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar, // إرجاع الصورة الجديدة
        position: user.position,
        department: user.department
      }
    });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ADD createAdmin HERE
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, branch_name } = req.body;
    
    const superAdminId = req.user._id;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        error: "EMAIL_EXISTS",
        message: "Email is already in use"
      });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      branch_name,
      is_active: true,
      email_verified: true,
      super_admin_id: superAdminId
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        branch_name: admin.branch_name,
        super_admin_id: admin.super_admin_id // تأكيد الربط
      }
    });
  } catch (err) {
    console.error("createAdmin error:", err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: err.message
    });
  }
};