import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema({
  // Company reference
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
    index: true
  },

  // Super admin reference (for tenant isolation)
  super_admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP", "EGP"]
  },

  // Subscription details (plan slug from Plan model - no enum restriction)
  plan: {
    type: String,
    required: true
  },
  billing_cycle: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true
  },

  // Payment status
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded", "cancelled"],
    default: "pending"
  },

  // Payment method
  payment_method: {
    type: String,
    enum: ["credit_card", "paypal", "bank_transfer", "paymob", "other"],
    default: "credit_card"
  },

  // Payment gateway details
  transaction_id: {
    type: String,
    sparse: true,
    unique: true
  },
  gateway_response: {
    type: mongoose.Schema.Types.Mixed
  },

  // Dates
  billing_start_date: {
    type: Date,
    required: true
  },
  billing_end_date: {
    type: Date,
    required: true
  },
  payment_date: {
    type: Date
  },

  // Refund details
  refund_amount: {
    type: Number,
    default: 0
  },
  refund_reason: {
    type: String,
    default: ""
  },
  refund_date: {
    type: Date
  },

  // Notes
  notes: {
    type: String,
    default: ""
  },

  // Auto-calculated fields
  is_active: {
    type: Boolean,
    default: true
  },
  next_billing_date: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
revenueSchema.index({ company_id: 1, status: 1 });
revenueSchema.index({ super_admin_id: 1, status: 1 });
revenueSchema.index({ plan: 1, status: 1 });
revenueSchema.index({ billing_end_date: 1 });
revenueSchema.index({ payment_date: 1 });
revenueSchema.index({ status: 1, payment_date: 1 });

// Pre-save middleware to calculate next billing date
revenueSchema.pre("save", function (next) {
  if (this.isModified("billing_end_date") && this.status === "completed") {
    // Calculate next billing date based on billing cycle
    const endDate = new Date(this.billing_end_date);
    if (this.billing_cycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (this.billing_cycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    this.next_billing_date = endDate;
  }
  next();
});

// Static method to get revenue by date range
revenueSchema.statics.getRevenueByDateRange = function (startDate, endDate, superAdminId = null) {
  const query = {
    payment_date: { $gte: startDate, $lte: endDate },
    status: "completed"
  };

  if (superAdminId) {
    query.super_admin_id = superAdminId;
  }

  return this.find(query).sort({ payment_date: -1 });
};

// Static method to get revenue summary
revenueSchema.statics.getRevenueSummary = async function (superAdminId = null) {
  const matchStage = {
    status: "completed"
  };

  if (superAdminId) {
    matchStage.super_admin_id = new mongoose.Types.ObjectId(superAdminId);
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        totalTransactions: { $sum: 1 },
        avgTransactionValue: { $avg: "$amount" },
        revenueByPlan: {
          $push: {
            plan: "$plan",
            amount: "$amount"
          }
        },
        revenueByMonth: {
          $push: {
            month: { $dateToString: { format: "%Y-%m", date: "$payment_date" } },
            amount: "$amount"
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransactionValue: 0,
    revenueByPlan: [],
    revenueByMonth: []
  };
};

// Static method to get monthly revenue trend
revenueSchema.statics.getMonthlyRevenueTrend = function (months = 12, superAdminId = null) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const matchStage = {
    payment_date: { $gte: startDate },
    status: "completed"
  };

  if (superAdminId) {
    matchStage.super_admin_id = new mongoose.Types.ObjectId(superAdminId);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: "$payment_date" },
          month: { $month: "$payment_date" }
        },
        revenue: { $sum: "$amount" },
        transactions: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);
};

// Instance method to check if subscription is expiring soon
revenueSchema.methods.isExpiringSoon = function (days = 30) {
  const now = new Date();
  const expiryDate = new Date(this.billing_end_date);
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= days && daysUntilExpiry > 0;
};

// Instance method to get subscription status
revenueSchema.methods.getSubscriptionStatus = function () {
  const now = new Date();
  const endDate = new Date(this.billing_end_date);

  if (this.status !== "completed") {
    return this.status;
  }

  if (now > endDate) {
    return "expired";
  }

  if (this.isExpiringSoon()) {
    return "expiring_soon";
  }

  return "active";
};

export default mongoose.model("Revenue", revenueSchema);
