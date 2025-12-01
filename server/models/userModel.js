import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },

    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true 
    },

    password: { 
      type: String, 
      required: true,
      minlength: 6 
    },

    role: {
      type: String,
      enum: ["super_admin", "admin", "employee"],
      required: true
    },

    branch_name: {
      type: String,
      trim: true
    },

    branch_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    super_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    phone: { 
      type: String, 
      trim: true,
      default: ""
    },

    position: { 
      type: String, 
      trim: true
    },

    is_active: { 
      type: Boolean, 
      default: true 
    },

    lastLogin: {
      type: Date,
      default: null
    },

    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    //ADDED: Email verification fields
    email_verified: { 
      type: Boolean, 
      default: false 
    },
    email_verification_token: { 
      type: String 
    },
    email_verification_expires: { 
      type: Date 
    },

    // ⭐⭐ ADDED: OTP fields for phone verification
    phone_verified: {
      type: Boolean,
      default: false
    },
    phone_otp: {
      type: String
    },
    phone_otp_expires: {
      type: Date
    }
  },
  { timestamps: true }
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (this.role === "super_admin") {
    this.branch_name = undefined;
    this.branch_admin_id = undefined;
    this.position = undefined;
    this.super_admin_id = undefined;
  }
  
  if (this.role === "admin") {
    this.branch_admin_id = undefined;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login method
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
  return this;
};

// ⭐⭐ ADDED: Email verification methods
userSchema.methods.verifyEmail = function() {
  this.email_verified = true;
  this.email_verification_token = undefined;
  this.email_verification_expires = undefined;
  return this.save();
};

userSchema.methods.isEmailVerificationRequired = function() {
  return !this.email_verified && this.email_verification_expires && this.email_verification_expires > Date.now();
};

userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.email_verification_token = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.email_verification_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return verificationToken; // Return unhashed token for email
};

// ⭐⭐ ADDED: Phone OTP methods
userSchema.methods.generatePhoneOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.phone_otp = otp;
  this.phone_otp_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

userSchema.methods.verifyPhoneOTP = function(enteredOTP) {
  if (!this.phone_otp || !this.phone_otp_expires) {
    return false;
  }
  
  const isMatch = this.phone_otp === enteredOTP;
  const isExpired = this.phone_otp_expires < Date.now();
  
  if (isMatch && !isExpired) {
    this.phone_verified = true;
    this.phone_otp = undefined;
    this.phone_otp_expires = undefined;
    this.save();
    return true;
  }
  
  return false;
};

userSchema.methods.isPhoneOTPValid = function() {
  return this.phone_otp && this.phone_otp_expires && this.phone_otp_expires > Date.now();
};

// Branch management methods
userSchema.methods.getBranchEmployees = async function () {
  if (this.role !== "admin") throw new Error('Admin access required');
  
  return mongoose.model("User").find({
    branch_admin_id: this._id,
    role: "employee"
  }).select('-password');
};

userSchema.methods.getBranchAdmin = async function () {
  if (this.role !== "employee") throw new Error('Employee access required');
  
  return mongoose.model("User").findById(this.branch_admin_id)
    .select('name email branch_name phone');
};

// Static methods
userSchema.statics.getAllBranches = function() {
  return this.find({ role: "admin" }) 
    .select('-password')
    .sort({ createdAt: -1 });
};

userSchema.statics.getSystemStats = async function() {
  const totalBranches = await this.countDocuments({ role: "admin" });
  const totalEmployees = await this.countDocuments({ role: "employee" });
  const activeBranches = await this.countDocuments({ 
    role: "admin", 
    is_active: true 
  });
  
  return {
    total_branches: totalBranches,
    total_employees: totalEmployees,
    active_branches: activeBranches,
    inactive_branches: totalBranches - activeBranches
  };
};

// Auto-generate branch name if not provided
userSchema.statics.generateBranchName = function(adminName) {
  return `${adminName}'s Branch - ${Date.now()}`;
};

// ⭐⭐ ADDED: Virtual for full profile
userSchema.virtual('profile').get(function() {
  const profile = {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    position: this.position,
    is_active: this.is_active,
    lastLogin: this.lastLogin,
    email_verified: this.email_verified,
    phone_verified: this.phone_verified,
    created_at: this.createdAt,
    super_admin_id: this.super_admin_id // إضافة معرف المالك للملف الشخصي
  };

  // Add branch info for admin
  if (this.role === "admin") {
    profile.branch_name = this.branch_name;
  }

  // Add branch info for employee
  if (this.role === "employee") {
    profile.branch_admin_id = this.branch_admin_id;
  }

  return profile;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

export default mongoose.model("User", userSchema);