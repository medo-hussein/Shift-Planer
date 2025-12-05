import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  super_admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, 
    index: true
  },

  date: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  check_in: { 
    type: Date, 
    required: true 
  },
  check_out: { 
    type: Date 
  },
  breaks: [{
    start: Date,
    end: Date,
    duration: Number // in minutes
  }],
  total_hours: { 
    type: Number, 
    default: 0 
  }, // in hours
  overtime: { 
    type: Number, 
    default: 0 
  }, // in hours
  late_minutes: { 
    type: Number, 
    default: 0 
  },
  shift_type: { 
    type: String, 
    enum: ["regular", "overtime", "holiday", "weekend", "emergency"],
    default: "regular"
  },
  status: {
    type: String,
    enum: ["present", "absent", "late", "half_day", "leave"],
    default: "present"
  },
  notes: String,
  location: String
}, { 
  timestamps: true 
});

// Index for quick queries
attendanceSchema.index({ user_id: 1, date: 1 }, { unique: true });
attendanceSchema.index({ super_admin_id: 1, date: 1 });

// Pre-save middleware to calculate durations
attendanceSchema.pre("save", function(next) {
  // Calculate total worked hours
  if (this.check_in && this.check_out) {
    const workedMs = this.check_out - this.check_in;
    let totalHours = workedMs / (1000 * 60 * 60); // Convert to hours
    
    // Subtract break durations
    if (this.breaks && this.breaks.length > 0) {
      const totalBreakMs = this.breaks.reduce((total, breakItem) => {
        if (breakItem.start && breakItem.end) {
          return total + (breakItem.end - breakItem.start);
        }
        return total;
      }, 0);
      
      const totalBreakHours = totalBreakMs / (1000 * 60 * 60);
      totalHours = Math.max(0, totalHours - totalBreakHours);
    }
    
    this.total_hours = parseFloat(totalHours.toFixed(2));

    // ✅ Smart Overtime Logic based on Shift Type
    const SPECIAL_SHIFT_TYPES = ['overtime', 'holiday', 'weekend', 'emergency'];

    if (SPECIAL_SHIFT_TYPES.includes(this.shift_type)) {
        // الحالة الأولى: شيفت خاص، كل الساعات تحسب كأوفر تايم
        this.overtime = this.total_hours;
    } else {
        // الحالة الثانية: شيفت عادي، الزيادة عن 8 ساعات فقط هي الأوفر تايم
        const STANDARD_WORK_HOURS = 8;
        
        if (this.total_hours > STANDARD_WORK_HOURS) {
          this.overtime = parseFloat((this.total_hours - STANDARD_WORK_HOURS).toFixed(2));
        } else {
          this.overtime = 0;
        }
    }
  }
  
  // Calculate break durations
  if (this.breaks && this.breaks.length > 0) {
    this.breaks.forEach(breakItem => {
      if (breakItem.start && breakItem.end) {
        const breakMs = breakItem.end - breakItem.start;
        breakItem.duration = Math.floor(breakMs / (1000 * 60));
      }
    });
  }
  
  // Auto-calculate status based on time
  if (this.check_in) {
    const checkInHour = this.check_in.getHours();
    const checkInMinute = this.check_in.getMinutes();
    
    // Late rule: After 9:15 AM)
    if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15)) {
      this.status = "late";
      this.late_minutes = (checkInHour - 9) * 60 + (checkInMinute - 15);
    } else {
      // Only set to 'present' if not already set to something specific like 'leave'
      if (this.status !== 'leave' && this.status !== 'half_day') {
        this.status = "present";
      }
    }
  }
  
  next();
});

// Static method to get attendance by user and date range
attendanceSchema.statics.findByUserAndDateRange = function(userId, startDate, endDate) {
  return this.find({
    user_id: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

// Static method to get attendance by admin (all employees under admin)
attendanceSchema.statics.findByAdmin = function(adminId, date) {
  return this.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $match: {
        "user.parent_admin_id": mongoose.Types.ObjectId(adminId),
        date: date
      }
    }
  ]);
};

export default mongoose.model("Attendance", attendanceSchema);