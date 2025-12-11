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
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import platformRoutes from "./routes/platformRoutes.js";
import swapRoutes from "./routes/swapRoutes.js";
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
app.use("/api/platform", platformRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/swaps", swapRoutes);
app.get("/", (req, res) => {
  res.send("ShiftMind API Running - Smart Workforce Management System");
});

// payment routes
app.use("/api", paymentRoutes);

// Redirect /payment-callback to frontend (Paymob transaction response callback)
// This route is hit by Paymob after payment, we redirect to frontend with all params
app.get("/payment-callback", (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/payment/callback?${queryString}`);
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);


