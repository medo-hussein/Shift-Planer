import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  super_admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["info", "success", "warning", "error", "announcement"], // ضفنا announcement
    default: "info"
  },
  link: {
    type: String,
    default: ""
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ============================================
// PERFORMANCE INDEXES
// ============================================
// Compound index for fetching user's unread notifications sorted by date
notificationSchema.index({ recipient_id: 1, is_read: 1, createdAt: -1 });
// Index for filtering by super_admin
notificationSchema.index({ super_admin_id: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);