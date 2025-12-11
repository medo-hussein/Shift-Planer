import express from "express";
import { createPayment, userPaid, webhook, debugPayment, forceFinalize, createRevenueManual, getBillingHistory } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initiate payment (Requires Auth)
router.post('/pay', protect, createPayment);

// Payment Status Check (Frontend Redirect)
router.get("/paymentStatus/:orderId", userPaid);

// Paymob Webhook (Public, secured by HMAC)
router.post("/webhook", webhook);

// Debug Route
router.get("/debug/:orderId", debugPayment);

// Force Finalize (for fixing pending payments when webhook fails)
router.get("/forceFinalize/:orderId", forceFinalize);

// Manual Revenue Creation (for orphaned orders when Paymob returns 404)
router.get("/createRevenueManual/:orderId", createRevenueManual); // Manual revenue creation
router.get("/payment/history", protect, getBillingHistory); // New Billing History endpoint

export default router;
