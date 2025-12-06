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

export default mongoose.model("PaymentIntent", paymentIntentSchema);
