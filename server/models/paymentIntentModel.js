import mongoose from "mongoose";

const paymentIntentSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "EGP"
    },
    plan: {
        type: String,
        required: true
    },
    billing_cycle: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
        index: true
    },
    transaction_id: {
        type: String,
        sparse: true
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// ============================================
// PERFORMANCE INDEXES
// ============================================
// Compound index for fetching user's payment history by status
paymentIntentSchema.index({ user_id: 1, status: 1 });
// Index for finding payments by date range
paymentIntentSchema.index({ createdAt: -1 });

export default mongoose.model("PaymentIntent", paymentIntentSchema);
