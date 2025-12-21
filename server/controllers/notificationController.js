import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

// 1. Get My Notifications
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient_id: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipient_id: req.user._id,
      is_read: false,
    });

    return res.json({
      success: true,
      data: notifications,
      unread_count: unreadCount,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Mark Notifications as Read
export const markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const query = { recipient_id: req.user._id, is_read: false };

    if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }

    await Notification.updateMany(query, { is_read: true });

    return res.json({ success: true, message: "Notifications marked as read" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Send Broadcast Announcement (The New Logic)
export const sendAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;
    const tenantOwnerId =
      senderRole === "super_admin" ? senderId : req.user.super_admin_id;

    if (!title || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Title and message are required" });
    }

    let recipients = [];

    if (senderRole === "super_admin") {
      recipients = await User.find({
        role: "admin",
        super_admin_id: senderId,
        is_active: true,
      }).select("_id");
    } else if (senderRole === "admin") {
      recipients = await User.find({
        role: "employee",
        branch_admin_id: senderId,
        is_active: true,
      }).select("_id");
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied" });
    }

    if (recipients.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No recipients found to send to." });
    }

    const notifications = recipients.map((user) => ({
      recipient_id: user._id,
      sender_id: senderId,
      super_admin_id: tenantOwnerId,
      title: `📢 ${title}`,
      message: message,
      type: "announcement",
      is_read: false,
      link: "", // Just for read
    }));

    await Notification.insertMany(notifications);

    return res.json({
      success: true,
      message: `Announcement sent successfully to ${recipients.length} users.`,
    });
  } catch (err) {
    console.error("sendAnnouncement error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createNotification = async ({
  recipientId,
  senderId,
  superAdminId,
  title,
  message,
  type,
  link,
}) => {
  try {
    await Notification.create({
      recipient_id: recipientId,
      sender_id: senderId,
      super_admin_id: superAdminId,
      title,
      message,
      type: type || "info",
      link,
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};
