import Message from "../models/messageModel.js";
import { sendContactFormEmail, sendContactReplyEmail } from "../utils/emailService.js";

// Submit Contact Form
export const submitContactForm = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate Input
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: "MISSING_FIELDS",
                message: "Please fill in all required fields (Name, Email, Message)",
            });
        }

        // Validate Email Format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: "INVALID_EMAIL",
                message: "Please provide a valid email address",
            });
        }

        // Save Message to Database
        const newMessage = await Message.create({
            name,
            email,
            phone,
            message,
        });

        // Send Email Notification to Admin (Non-blocking)
        sendContactFormEmail({ name, email, phone, message }).catch((err) =>
            console.error("Failed to send contact notification email:", err)
        );

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: newMessage,
        });
    } catch (error) {
        console.error("submitContactForm error:", error);
        return res.status(500).json({
            success: false,
            error: "SERVER_ERROR",
            message: "Failed to send message. Please try again later.",
        });
    }
};

// Get All Messages (Platform Owner)
export const getMessages = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};

        if (status && status !== 'all') {
            filter.status = status;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const messages = await Message.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Message.countDocuments(filter);

        return res.json({
            success: true,
            data: messages,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error) {
        console.error("getMessages error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
        });
    }
};

// Reply to Message (Platform Owner)
export const replyToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage, subject } = req.body;

        if (!replyMessage) {
            return res.status(400).json({
                success: false,
                message: "Reply message is required",
            });
        }

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        // Send Email
        await sendContactReplyEmail({
            to: message.email,
            subject,
            replyMessage,
            originalMessage: message.message
        });

        // Update Status
        message.status = "replied";
        await message.save();

        return res.json({
            success: true,
            message: "Reply sent successfully",
            data: message,
        });
    } catch (error) {
        console.error("replyToMessage error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send reply",
        });
    }
};

// Delete Message (Platform Owner)
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        await message.deleteOne();

        return res.json({
            success: true,
            message: "Message deleted successfully",
        });
    } catch (error) {
        console.error("deleteMessage error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete message",
        });
    }
};
