import express from "express";
import {
    submitContactForm,
    getMessages,
    replyToMessage,
    deleteMessage
} from "../controllers/contactController.js";
import { protect, platformOwnerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route to submit
router.post("/", submitContactForm);

// Protected routes (Platform Owner)
router.get("/", protect, platformOwnerOnly, getMessages);
router.post("/:id/reply", protect, platformOwnerOnly, replyToMessage);
router.delete("/:id", protect, platformOwnerOnly, deleteMessage);

export default router;
