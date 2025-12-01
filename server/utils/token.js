import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      branch_admin_id: user.branch_admin_id,  // Added for branch system
      branch_name: user.branch_name,           // Added for easy access
      super_admin_id: user.super_admin_id     // ISOLATION: The ID of the Tenant Owner
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },               
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d" }
  );
};