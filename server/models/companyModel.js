import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    industry: {
      type: String,
      trim: true,
      default: ""
    },

    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
      default: "1-10"
    },

    website: {
      type: String,
      trim: true,
      default: ""
    },

    phone: {
      type: String,
      trim: true,
      default: ""
    },

    email: {
      type: String,
      trim: true,
      default: ""
    },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" }
    },

    logo: {
      type: String,
      default: ""
    },

    settings: {
      timezone: {
        type: String,
        default: "UTC"
      },
      dateFormat: {
        type: String,
        default: "DD/MM/YYYY"
      },
      currency: {
        type: String,
        default: "USD"
      },
      workingDays: [{
        type: String,
        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      }],
      workingHours: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" }
      }
    },

    subscription: {
      plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
        required: false // Optional for now to support legacy data
      },
      plan_name: { // Snapshot of plan name
        type: String,
        default: "free"
      },
      status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        default: "active"
      },
      expiresAt: {
        type: Date,
        default: null
      },
      maxUsers: {
        type: Number,
        default: 5 // Default for free plan
      },
      maxBranches: {
        type: Number,
        default: 1 // Default for free plan
      }
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    verificationToken: String,
    verificationExpires: Date
  },
  { timestamps: true }
);

// Index for better performance
companySchema.index({ isActive: 1 });
companySchema.index({ "subscription.status": 1 });

// Static methods
companySchema.statics.getActiveCompanies = function () {
  return this.find({ isActive: true })
    .select('-verificationToken -verificationExpires')
    .sort({ createdAt: -1 });
};

companySchema.statics.getCompanyStats = async function (companyId) {
  const User = mongoose.model("User");

  const stats = await User.aggregate([
    { $match: { company: companyId } },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

// Instance methods
companySchema.methods.updateSettings = function (newSettings) {
  Object.assign(this.settings, newSettings);
  return this.save();
};

companySchema.methods.updateSubscription = function (plan, maxUsers) {
  this.subscription.plan = plan;
  this.subscription.maxUsers = maxUsers;
  this.subscription.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
  return this.save();
};

companySchema.methods.getUserCount = async function () {
  const User = mongoose.model("User");
  return await User.countDocuments({ company: this._id });
};

companySchema.methods.canAddUser = async function () {
  const currentUsers = await this.getUserCount();
  return currentUsers < this.subscription.maxUsers;
};

// Pre-save middleware
companySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.name = this.name.trim();
  }
  next();
});

const Company = mongoose.model("Company", companySchema);

export default Company;