import express from "express";
import { createPayment, userPaid } from "../controllers/paymentController.js";


const router = express.Router();

// here the useris requestss to payy
router.post('/pay',createPayment)
// here we are checking if the users paid or not !
router.get("/paymentStatus/:orderId", userPaid);
export default router