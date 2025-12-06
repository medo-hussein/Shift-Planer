import mongoose from "mongoose";

const platformAnalyticsSchema = new mongoose.Schema({
  // Platform overview metrics
  total_companies: {
    type: Number,
    default: 0
  },
  active_companies: {
    type: Number,
    default: 0
  },
  total_super_admins: {
    type: Number,
    default: 0
  },
  total_branches: {
    type: Number,
    default: 0
  },
  total_employees: {
    type: Number,
    default: 0
  },
  active_employees: {
    type: Number,
    default: 0
  },

  // Revenue metrics
  total_revenue: {
    type: Number,
    default: 0
  },
  monthly_revenue: {
    type: Number,
    default: 0
  },
  yearly_revenue: {
    type: Number,
    default: 0
  },

  // Subscription distribution
  subscription_breakdown: {
    free: { type: Number, default: 0 },
    basic: { type: Number, default: 0 },
    pro: { type: Number, default: 0 },
    enterprise: { type: Number, default: 0 }
  },

  // Growth metrics
  new_companies_this_month: {
    type: Number,
    default: 0
  },
  new_employees_this_month: {
    type: Number,
    default: 0
  },
  churn_rate: {
    type: Number,
    default: 0
  },

  // System health
  server_status: {
    type: String,
    enum: ["healthy", "warning", "critical"],
    default: "healthy"
  },
  avg_response_time: {
    type: Number,
    default: 0
  },
  error_rate: {
    type: Number,
    default: 0
  },

  // Date tracking
  date: {
    type: Date,
    required: true,
    index: true
  },

  // Additional metrics
  total_shifts: {
    type: Number,
    default: 0
  },
  total_attendance_records: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries


// Static method to get analytics for date range
platformAnalyticsSchema.statics.getAnalyticsByDateRange = function (startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get latest analytics
platformAnalyticsSchema.statics.getLatestAnalytics = function () {
  return this.findOne().sort({ date: -1 });
};

// Static method to create daily analytics snapshot
platformAnalyticsSchema.statics.createDailySnapshot = async function () {
  const User = mongoose.model("User");
  const Company = mongoose.model("Company");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get counts
  const [
    totalCompanies,
    activeCompanies,
    totalSuperAdmins,
    totalBranches,
    totalEmployees,
    activeEmployees
  ] = await Promise.all([
    Company.countDocuments(),
    Company.countDocuments({ isActive: true }),
    User.countDocuments({ role: "super_admin" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "employee" }),
    User.countDocuments({ role: "employee", is_active: true })
  ]);

  // Get subscription breakdown
  const subscriptionStats = await Company.aggregate([
    {
      $group: {
        _id: "$subscription.plan",
        count: { $sum: 1 }
      }
    }
  ]);

  const subscriptionBreakdown = {
    free: 0,
    basic: 0,
    pro: 0,
    enterprise: 0
  };

  subscriptionStats.forEach(stat => {
    if (subscriptionBreakdown.hasOwnProperty(stat._id)) {
      subscriptionBreakdown[stat._id] = stat.count;
    }
  });

  // Calculate new companies this month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const newCompaniesThisMonth = await Company.countDocuments({
    createdAt: { $gte: firstDayOfMonth }
  });

  const newEmployeesThisMonth = await User.countDocuments({
    role: "employee",
    createdAt: { $gte: firstDayOfMonth }
  });

  return this.create({
    total_companies: totalCompanies,
    active_companies: activeCompanies,
    total_super_admins: totalSuperAdmins,
    total_branches: totalBranches,
    total_employees: totalEmployees,
    active_employees: activeEmployees,
    subscription_breakdown: subscriptionBreakdown,
    new_companies_this_month: newCompaniesThisMonth,
    new_employees_this_month: newEmployeesThisMonth,
    date: today
  });
};

export default mongoose.model("PlatformAnalytics", platformAnalyticsSchema);
