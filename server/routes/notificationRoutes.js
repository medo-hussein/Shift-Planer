import express from "express";
import { protect, adminOrAbove } from "../middleware/authMiddleware.js";
import { getMyNotifications, markAsRead, sendAnnouncement } from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.put("/read", markAsRead);
router.post("/announce", adminOrAbove, sendAnnouncement); //  الراوت الجديد

export default router;