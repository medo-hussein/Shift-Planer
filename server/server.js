import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";

// Add to routes
// Import the new routes
import superAdminRoutes from "./routes/superAdminRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Base API routes
app.use("/api/auth", authRoutes);      
app.use("/api/users", userRoutes);      
app.use("/api/shifts", shiftRoutes);   
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);

// New role-based routes
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/otp", otpRoutes);

app.get("/", (req, res) => {
  res.send("ShiftMind API Running - Smart Workforce Management System");
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);

// 🎯 Updated Features - ShiftMind New Architecture

// 🏢 New Branch-Based System
// Super Admin → Manages entire system and all branches
// Branch Admin → Manages their specific branch and employees  
// Employee → Belongs to a specific branch with limited access

// 🔐 Enhanced Role-Based Access
// Super Admin: Full system access + branch management
// Admin: Branch-specific management + employee oversight
// Employee: Personal data + attendance + shifts

// 📊 Consolidated Features
// Attendance tracking with branch isolation
// Shift management per branch
// Reports with branch-level permissions
// Employee management within branches

// 🚀 Improved Security
// Branch isolation prevents cross-branch data access
// Granular permissions for each role
// Automatic access control based on branch_admin_id

// 💡 Key Benefits
// Scalable multi-branch architecture
// Secure data isolation between branches
// Flexible role-based permissions
// Simplified user management