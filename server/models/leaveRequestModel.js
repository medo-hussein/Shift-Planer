import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
  // 1. Employee who submitted the request (This is the user ID, whether employee or admin submitting for themselves)
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // 2. Tenant Isolation Key
  super_admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // 3. Admin of the branch OR Super Admin ID (This field holds the ID of the person *responsible for approval* or the *tenant owner*.)
  branch_admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // 4. Request Details
  leave_type: {
    type: String,
    enum: ["vacation", "sick", "personal", "unpaid", "other"],
    default: "vacation",
    required: true,
  },
  
  start_date: {
    type: Date,
    required: true,
  },
  
  end_date: {
    type: Date,
    required: true,
  },
  
  // Calculate duration in days (inclusive day count)
  duration_days: {
    type: Number,
    required: true,
  },

  reason: {
    type: String,
    required: true,
    trim: true,
  },

  // 5. Approval Status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  
  admin_notes: {
    type: String,
    default: "",
    trim: true,
  },
  
  // 6. Metadata
  is_half_day: {
    type: Boolean,
    default: false,
  }
}, { 
  timestamps: true 
});

// Pre-save middleware to calculate duration
leaveRequestSchema.pre("validate", function(next) {
    if (this.start_date && this.end_date) {
        // Calculate duration in full days (inclusive: start date to end date)
        const start = new Date(this.start_date.setHours(0, 0, 0, 0));
        const end = new Date(this.end_date.setHours(23, 59, 59, 999));
        
        const diffTime = Math.abs(end.getTime() - start.getTime());
        // +1 to make it inclusive (e.g., today to today is 1 day)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        this.duration_days = diffDays;
    }
    next();
});

// Compound index for performance
leaveRequestSchema.index({ employee_id: 1, start_date: 1, end_date: 1 });

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
export default LeaveRequest;