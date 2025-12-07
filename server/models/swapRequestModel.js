import mongoose from "mongoose";

const swapRequestSchema = new mongoose.Schema({
  // 1. The employee requesting the swap (Owner of the original shift)
  requester_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  
  // 2. The shift to be swapped
  shift_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Shift", 
    required: true 
  },
  
  // 3. The target employee (Optional: if left empty, it becomes an Open Shift for anyone to pick up)
  target_employee_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  
  // 4. The target shift (Optional: if swapping shift-for-shift)
  target_shift_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Shift" 
  },
  
  // 5. Data Isolation fields (So the Admin can see and manage the request)
  branch_admin_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  super_admin_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  // 6. Request Status
  status: {
    type: String,
    enum: ["pending", "accepted", "approved", "rejected", "cancelled"],
    default: "pending"
    // pending: Waiting for colleague response (or waiting for pickup)
    // accepted: Colleague accepted (Waiting for Admin approval)
    // approved: Admin approved (Swap completed)
    // rejected: Admin or Colleague rejected
    // cancelled: Requester cancelled
  },

  // 7. Reason for the swap
  reason: { 
    type: String, 
    default: "",
    trim: true
  }
}, { 
  timestamps: true 
});

// Indexes for fast lookup of requests by a specific employee
swapRequestSchema.index({ requester_id: 1, status: 1 });
swapRequestSchema.index({ target_employee_id: 1, status: 1 });

export default mongoose.model("SwapRequest", swapRequestSchema);