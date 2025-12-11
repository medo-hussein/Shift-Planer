import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: "EGP"
        },
        billing_cycle: {
            type: String,
            enum: ["monthly", "yearly"],
            required: true
        },
        limits: {
            max_branches: {
                type: Number,
                default: 1
            },
            max_employees: {
                type: Number,
                default: 5
            }
        },
        features: [{
            type: String
        }],
        is_active: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// ============================================
// PERFORMANCE INDEXES
// ============================================
// Index for filtering active plans
planSchema.index({ is_active: 1 });

export default mongoose.model("Plan", planSchema);
