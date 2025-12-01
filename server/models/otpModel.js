import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 6
  },
  type: {
    type: String,
    enum: ["email_verification", "password_reset", "phone_verification"],
    default: "email_verification",
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 600 // 10 minutes auto-delete
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Add compound index for efficient queries
  index: [
    { email: 1, type: 1, isVerified: 1 },
    { email: 1, expiresAt: 1 }
  ]
});

// Pre-save middleware to hash OTP for security
otpSchema.pre("save", function(next) {
  if (this.isModified("otp") && !this.isVerified) {
    // Hash OTP for security (optional but recommended)
    // For now, we'll keep it plain for simplicity in development
    // In production, consider hashing: this.otp = crypto.createHash('sha256').update(this.otp).digest('hex');
  }
  next();
});

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to find valid OTP
otpSchema.statics.findValidOTP = async function(email, otp, type = "email_verification") {
  const validOTP = await this.findOne({
    email: email.toLowerCase(),
    otp: otp,
    type: type,
    isVerified: false,
    expiresAt: { $gt: Date.now() },
    attempts: { $lt: 5 }
  });

  return validOTP;
};

// Instance method to mark as verified
otpSchema.methods.markAsVerified = function() {
  this.isVerified = true;
  return this.save();
};

// Instance method to increment attempts
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Instance method to check if expired
otpSchema.methods.isExpired = function() {
  return this.expiresAt < Date.now();
};

// Instance method to check if max attempts reached
otpSchema.methods.isMaxAttemptsReached = function() {
  return this.attempts >= 5;
};

// Clean up expired OTPs periodically
otpSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: Date.now() }
  });
  console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
  return result;
};

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
