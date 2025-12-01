import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    // The employee assigned to this shift
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The admin who created this shift (branch admin)
    created_by_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Shift title or name (e.g., "Morning Shift", "Night Shift")
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Shift description (optional)
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Start date and time of the shift
    start_date_time: {
      type: Date,
      required: true,
    },

    // End date and time of the shift
    end_date_time: {
      type: Date,
      required: true,
    },

    // Shift status
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"],
      default: "scheduled",
    },

    // Shift type (e.g., regular, overtime, holiday)
    shift_type: {
      type: String,
      enum: ["regular", "overtime", "holiday", "weekend", "emergency"],
      default: "regular",
    },

    // Location where shift takes place (optional)
    location: {
      type: String,
      trim: true,
      default: "",
    },

    // Notes for the employee or admin
    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // Actual start time (when employee checks in)
    actual_start_time: {
      type: Date,
    },

    // Actual end time (when employee checks out)
    actual_end_time: {
      type: Date,
    },

    // Break times during the shift
    breaks: [
      {
        break_start: Date,
        break_end: Date,
        break_duration: Number, // in minutes
        notes: String,
      },
    ],

    // Auto-calculated total worked minutes
    total_worked_minutes: {
      type: Number,
      default: 0,
    },

    // Overtime minutes
    overtime_minutes: {
      type: Number,
      default: 0,
    },

    // Late minutes if employee started late
    late_minutes: {
      type: Number,
      default: 0,
    },

    // Early leave minutes if employee left early
    early_leave_minutes: {
      type: Number,
      default: 0,
    },

    // Whether the shift requires approval
    requires_approval: {
      type: Boolean,
      default: false,
    },

    // Approval status
    approval_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Approved/rejected by admin
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Approval/rejection notes
    approval_notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent overlapping shifts for the same employee
shiftSchema.index(
  {
    employee_id: 1,
    start_date_time: 1,
    end_date_time: 1,
  },
  { unique: true }
);

// Quick query for shifts by employee and date range
shiftSchema.index({
  employee_id: 1,
  start_date_time: 1,
});

// Quick query for shifts by admin and date range
shiftSchema.index({
  created_by_admin_id: 1,
  start_date_time: 1,
});

// Quick query for shifts by status
shiftSchema.index({
  status: 1,
  start_date_time: 1,
});

// Pre-save middleware to calculate durations and status
shiftSchema.pre("save", function (next) {
  // Calculate total worked minutes if actual times are available
  if (this.actual_start_time && this.actual_end_time) {
    const workedMs = this.actual_end_time - this.actual_start_time;
    this.total_worked_minutes = Math.floor(workedMs / (1000 * 60));

    // Subtract break durations
    if (this.breaks && this.breaks.length > 0) {
      const totalBreakMs = this.breaks.reduce((total, breakItem) => {
        if (breakItem.break_start && breakItem.break_end) {
          return total + (breakItem.break_end - breakItem.break_start);
        }
        return total;
      }, 0);
      
      const totalBreakMinutes = Math.floor(totalBreakMs / (1000 * 60));
      this.total_worked_minutes = Math.max(0, this.total_worked_minutes - totalBreakMinutes);
    }

    // Calculate overtime (if worked more than scheduled)
    const scheduledMs = this.end_date_time - this.start_date_time;
    const scheduledMinutes = Math.floor(scheduledMs / (1000 * 60));
    
    if (this.total_worked_minutes > scheduledMinutes) {
      this.overtime_minutes = this.total_worked_minutes - scheduledMinutes;
    }

    // Calculate late minutes
    if (this.actual_start_time > this.start_date_time) {
      const lateMs = this.actual_start_time - this.start_date_time;
      this.late_minutes = Math.floor(lateMs / (1000 * 60));
    }

    // Calculate early leave minutes
    if (this.actual_end_time < this.end_date_time) {
      const earlyMs = this.end_date_time - this.actual_end_time;
      this.early_leave_minutes = Math.floor(earlyMs / (1000 * 60));
    }
  }

  // Auto-update break durations
  if (this.breaks && this.breaks.length > 0) {
    this.breaks.forEach((breakItem) => {
      if (breakItem.break_start && breakItem.break_end) {
        const breakMs = breakItem.break_end - breakItem.break_start;
        breakItem.break_duration = Math.floor(breakMs / (1000 * 60));
      }
    });
  }

  next();
});

// ⭐⭐ AUTO-APPROVAL MIDDLEWARE - NEW ⭐⭐
// Auto-approval for shifts that don't require approval
shiftSchema.pre("save", function (next) {
  // Auto-approve shifts that don't require manual approval
  if (this.requires_approval === false && this.approval_status === "pending") {
    this.approval_status = "approved";
    this.approved_by = this.created_by_admin_id;
  }
  next();
});

// Static method to find shifts by employee and date range
shiftSchema.statics.findByEmployeeAndDateRange = function (employeeId, startDate, endDate) {
  return this.find({
    employee_id: employeeId,
    start_date_time: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ start_date_time: 1 });
};

// Static method to find shifts by admin (all employees under admin)
shiftSchema.statics.findByAdminAndDateRange = function (adminId, startDate, endDate) {
  return this.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "employee_id",
        foreignField: "_id",
        as: "employee",
      },
    },
    {
      $unwind: "$employee",
    },
    {
      $match: {
        "employee.branch_admin_id": mongoose.Types.ObjectId(adminId),
        start_date_time: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $sort: { start_date_time: 1 },
    },
  ]);
};

// Static method to find today's shifts for an employee
shiftSchema.statics.findTodayShiftsByEmployee = function (employeeId) {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  return this.find({
    employee_id: employeeId,
    start_date_time: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).sort({ start_date_time: 1 });
};

// Instance method to check if shift is active now
shiftSchema.methods.isActiveNow = function () {
  const now = new Date();
  return (
    this.status === "in_progress" ||
    (this.start_date_time <= now && this.end_date_time >= now && this.status === "scheduled")
  );
};

// Instance method to calculate scheduled duration in minutes
shiftSchema.methods.getScheduledDuration = function () {
  const durationMs = this.end_date_time - this.start_date_time;
  return Math.floor(durationMs / (1000 * 60));
};

const Shift = mongoose.model("Shift", shiftSchema);
export default Shift;