import Shift from "../models/shiftModel.js";
import User from "../models/userModel.js";

const MS_IN_24H = 24 * 60 * 60 * 1000;

const parseDateWithValidation = (dateString, fieldName) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}: ${dateString}`);
  }
  return date;
};

const validateStartEnd = (startISO, endISO) => {
  try {
    const start = parseDateWithValidation(startISO, "start_date_time");
    const end = parseDateWithValidation(endISO, "end_date_time");

    if (start >= end) {
      return { ok: false, message: "start_date_time must be before end_date_time" };
    }
    if (end - start > MS_IN_24H) {
      return { ok: false, message: "Shift cannot exceed 24 hours" };
    }

    return { ok: true, start, end };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

// CREATE SHIFT (Admin only)
export const createShift = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId = userRole === "super_admin" ? adminId : req.user.super_admin_id; 

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can create shifts" 
      });
    }

    const { employee_id, start_date_time, end_date_time, title, description, shift_type, location, notes } = req.body;

    // Validate required fields
    if (!employee_id || !start_date_time || !end_date_time) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, start date, and end date are required"
      });
    }

    const validation = validateStartEnd(start_date_time, end_date_time);
    if (!validation.ok) {
      return res.status(400).json({ 
        success: false,
        message: validation.message 
      });
    }
    const { start, end } = validation;

    // Check employee exists and belongs to this admin (if admin)
    const employee = await User.findById(employee_id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "Employee not found" 
      });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({
        success: false,
        message: "Shifts can only be assigned to employees"
      });
    }

    if (!employee.is_active) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign shift to inactive employee"
      });
    }
    
    if (employee.super_admin_id?.toString() !== tenantOwnerId.toString()) {
       return res.status(403).json({
          success: false,
          message: "Employee does not belong to your system"
        });
    }
    // Check permissions (Admin can only assign shifts to their own branch employees)
    if (userRole === "admin") {
      if (employee.branch_admin_id?.toString() !== adminId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Employee does not belong to your branch"
        });
      }
    }

    const overlapping = await Shift.findOne({
      employee_id: employee_id,
      super_admin_id: tenantOwnerId,
      start_date_time: { $lt: end },
      end_date_time: { $gt: start },
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: "Shift overlaps with an existing shift",
        details: {
          existing_shift: {
            id: overlapping._id,
            start: overlapping.start_date_time,
            end: overlapping.end_date_time
          }
        }
      });
    }

    const shift = await Shift.create({
      employee_id: employee_id,
      created_by_admin_id: adminId,
      super_admin_id: tenantOwnerId,
      title: title || "Scheduled Shift",
      description: description || "",
      start_date_time: start,
      end_date_time: end,
      shift_type: shift_type || "regular",
      location: location || "",
      notes: notes || "",
    });

    const populated = await Shift.findById(shift._id)
      .populate("employee_id", "name email position")
      .populate("created_by_admin_id", "name branch_name");

    return res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data: populated
    });
  } catch (err) {
    console.error("createShift error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET BRANCH SHIFTS (Admin only)
export const getBranchShifts = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId = userRole === "super_admin" ? adminId : req.user.super_admin_id; 

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can view branch shifts" 
      });
    }

    const { 
      start: startISO, 
      end: endISO, 
      page = 1, 
      limit = 50,
      employee_id,
      status
    } = req.query;

    // Build query based on user role
    let query = {
      super_admin_id: tenantOwnerId 
    };

    if (userRole === "admin") {
      const employees = await User.find({ 
        branch_admin_id: adminId,
        role: "employee",
        super_admin_id: tenantOwnerId
      });
      const employeeIds = employees.map(emp => emp._id);
      
      query.employee_id = { $in: employeeIds };
    }

    // Add employee filter if specified
    if (employee_id) {
      if (userRole === "admin") {
        // Verify employee belongs to this admin
        const employee = await User.findOne({
          _id: employee_id,
          branch_admin_id: adminId,
          super_admin_id: tenantOwnerId
        });
        if (!employee) {
          return res.status(403).json({ 
            success: false,
            message: "Employee not found in your branch" 
          });
        }
      }
      query.employee_id = employee_id;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add date range filter
    if (startISO && endISO) {
      try {
        const start = parseDateWithValidation(startISO, "start date");
        const end = parseDateWithValidation(endISO, "end date");
        
        query.start_date_time = { $lt: end };
        query.end_date_time = { $gt: start };
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    const shifts = await Shift.find(query)
      .populate("employee_id", "name email position")
      .populate("created_by_admin_id", "name branch_name")
      .sort({ start_date_time: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Shift.countDocuments(query);

    return res.json({
      success: true,
      data: shifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("getBranchShifts error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET MY SHIFTS (Employee only)
export const getMyShifts = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId = req.user.super_admin_id; 

    if (userRole !== "employee") {
      return res.status(403).json({ 
        success: false,
        message: "Only employees can view their shifts" 
      });
    }

    const { 
      start: startISO, 
      end: endISO, 
      page = 1, 
      limit = 50,
      status
    } = req.query;

    const query = { 
      employee_id: userId,
      super_admin_id: tenantOwnerId
    };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add date range filter
    if (startISO && endISO) {
      try {
        const start = parseDateWithValidation(startISO, "start date");
        const end = parseDateWithValidation(endISO, "end date");
        
        query.start_date_time = { $lt: end };
        query.end_date_time = { $gt: start };
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    const shifts = await Shift.find(query)
      .populate("created_by_admin_id", "name branch_name")
      .sort({ start_date_time: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Shift.countDocuments(query);

    return res.json({
      success: true,
      data: shifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("getMyShifts error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// UPDATE SHIFT (Admin only)
export const updateShift = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId = userRole === "super_admin" ? adminId : req.user.super_admin_id; 
    const { id } = req.params;

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can update shifts" 
      });
    }

    const { start_date_time, end_date_time, employee_id, title, description, shift_type, location, notes, status } = req.body;

    const shift = await Shift.findOne({
      _id: id,
      super_admin_id: tenantOwnerId 
    });
    
    if (!shift) {
      return res.status(404).json({ 
        success: false,
        message: "Shift not found or not authorized" // رسالة تجمع بين عدم الوجود وعدم الصلاحية
      });
    }

    // Check permissions (Admin must be the creator, Super Admin passes the ownership check above)
    if (userRole === "admin" && shift.created_by_admin_id.toString() !== adminId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this shift" 
      });
    }

    // New employee validation
    let finalEmployee = shift.employee_id.toString();

    if (employee_id && employee_id !== finalEmployee) {
      const newEmp = await User.findById(employee_id);
      if (!newEmp) {
        return res.status(404).json({ 
          success: false,
          message: "Employee not found" 
        });
      }

      if (newEmp.role !== "employee") {
        return res.status(400).json({
          success: false,
          message: "Shifts can only be assigned to employees"
        });
      }

      if (!newEmp.is_active) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign shift to inactive employee"
        });
      }
      
      if (newEmp.super_admin_id?.toString() !== tenantOwnerId.toString()) {
        return res.status(403).json({
           success: false,
           message: "New employee does not belong to your system"
        });
      }

      if (userRole === "admin" && newEmp.branch_admin_id?.toString() !== adminId.toString()) {
        return res.status(403).json({
          success: false,
          message: "New employee does not belong to your branch"
        });
      }

      finalEmployee = employee_id;
    }

    // Validate times if changed
    let newStart = shift.start_date_time;
    let newEnd = shift.end_date_time;

    if (start_date_time || end_date_time) {
      const startISO = start_date_time || shift.start_date_time.toISOString();
      const endISO = end_date_time || shift.end_date_time.toISOString();

      const validation = validateStartEnd(startISO, endISO);
      if (!validation.ok) {
        return res.status(400).json({ 
          success: false,
          message: validation.message 
        });
      }

      newStart = validation.start;
      newEnd = validation.end;
    }

    // Overlap check with other shifts (exclude current shift)
    const overlapping = await Shift.findOne({
      employee_id: finalEmployee,
      super_admin_id: tenantOwnerId,
      _id: { $ne: shift._id },
      start_date_time: { $lt: newEnd },
      end_date_time: { $gt: newStart },
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: "Updated shift overlaps another shift",
        details: {
          existing_shift: {
            id: overlapping._id,
            start: overlapping.start_date_time,
            end: overlapping.end_date_time
          }
        }
      });
    }

    // Update shift
    shift.employee_id = finalEmployee;
    shift.start_date_time = newStart;
    shift.end_date_time = newEnd;
    if (title !== undefined) shift.title = title;
    if (description !== undefined) shift.description = description;
    if (shift_type !== undefined) shift.shift_type = shift_type;
    if (location !== undefined) shift.location = location;
    if (notes !== undefined) shift.notes = notes;
    if (status !== undefined) shift.status = status;

    await shift.save();

    const populated = await Shift.findById(shift._id)
      .populate("employee_id", "name email position")
      .populate("created_by_admin_id", "name branch_name");

    return res.json({
      success: true,
      message: "Shift updated successfully",
      data: populated
    });
  } catch (err) {
    console.error("updateShift error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// DELETE SHIFT (Admin only)
export const deleteShift = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId = userRole === "super_admin" ? adminId : req.user.super_admin_id; 
    const { id } = req.params;
    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can delete shifts" 
      });
    }

    const shift = await Shift.findOne({
      _id: id,
      super_admin_id: tenantOwnerId
    });
    
    if (!shift) {
      return res.status(404).json({ 
        success: false,
        message: "Shift not found or not authorized" 
      });
    }

    // Check permissions (Admin must be the creator, Super Admin passes the ownership check above)
    if (userRole === "admin" && shift.created_by_admin_id.toString() !== adminId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to delete this shift" 
      });
    }

    await shift.deleteOne();

    return res.json({ 
      success: true,
      message: "Shift deleted successfully" 
    });
  } catch (err) {
    console.error("deleteShift error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// BULK SHIFTS CREATION (Admin only)
export const createBulkShifts = async (req, res) => {
  try {
    const adminId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId = userRole === "super_admin" ? adminId : req.user.super_admin_id; 

    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can create bulk shifts" 
      });
    }

    const { shifts } = req.body;

    if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Shifts array is required and cannot be empty"
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const [index, shiftData] of shifts.entries()) {
      try {
        // Validate required fields
        if (!shiftData.employee_id || !shiftData.start_date_time || !shiftData.end_date_time) {
          results.failed.push({
            index,
            employee_id: shiftData.employee_id,
            error: "Missing required fields: employee_id, start_date_time, or end_date_time"
          });
          continue;
        }

        const validation = validateStartEnd(shiftData.start_date_time, shiftData.end_date_time);
        if (!validation.ok) {
          results.failed.push({
            index,
            employee_id: shiftData.employee_id,
            error: validation.message
          });
          continue;
        }

        const { start, end } = validation;

        // Check employee
        const employee = await User.findById(shiftData.employee_id);
        if (!employee) {
          results.failed.push({
            index,
            employee_id: shiftData.employee_id,
            error: "Employee not found"
          });
          continue;
        }

        if (employee.role !== "employee") {
          results.failed.push({
            index,
            employee_id: shiftData.employee_id,
            error: "Shifts can only be assigned to employees"
          });
          continue;
        }

        if (!employee.is_active) {
          results.failed.push({
            index,
            employee_id: shiftData.employee_id,
            error: "Cannot assign shift to inactive employee"
          });
          continue;
        }
        
        if (employee.super_admin_id?.toString() !== tenantOwnerId.toString()) {
          results.failed.push({
            index,
            employee_id: shiftData.employee_id,
            error: "Employee does not belong to your system"
          });
          continue;
        }
        // Check permissions for employee
        if (userRole === "admin" && employee.branch_admin_id?.toString() !== adminId.toString()) {
          results.failed.push({
            index,
            employee_id: shiftData.employee_id,
            error: "Employee does not belong to your branch"
          });
          continue;
        }

        // Overlap check
        const overlapping = await Shift.findOne({
          employee_id: shiftData.employee_id,
          super_admin_id: tenantOwnerId,
          start_date_time: { $lt: end },
          end_date_time: { $gt: start },
        });

        if (overlapping) {
          results.failed.push({
            index,
            employee_id: shiftData.employee_id,
            error: "Shift overlaps with existing shift"
          });
          continue;
        }

        const shift = await Shift.create({
          employee_id: shiftData.employee_id,
          created_by_admin_id: adminId,
          super_admin_id: tenantOwnerId,
          title: shiftData.title || "Scheduled Shift",
          description: shiftData.description || "",
          start_date_time: start,
          end_date_time: end,
          shift_type: shiftData.shift_type || "regular",
          location: shiftData.location || "",
          notes: shiftData.notes || "",
        });

        const populated = await Shift.findById(shift._id)
          .populate("employee_id", "name email position")
          .populate("created_by_admin_id", "name branch_name");

        results.successful.push(populated);

      } catch (error) {
        results.failed.push({
          index,
          employee_id: shiftData.employee_id,
          error: error.message
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Bulk shift creation completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      data: results
    });
  } catch (err) {
    console.error("createBulkShifts error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
// GET TODAY'S SHIFTS (Employee only)
export const getTodayShifts = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId = req.user.super_admin_id; 
    if (userRole !== "employee") {
      return res.status(403).json({ 
        success: false,
        message: "Only employees can view today's shifts" 
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + MS_IN_24H);

    const shifts = await Shift.find({
      employee_id: userId,
      super_admin_id: tenantOwnerId,
      start_date_time: { 
        $gte: today,
        $lt: tomorrow 
      }
    })
    .populate("created_by_admin_id", "name branch_name")
    .sort({ start_date_time: 1 });

    return res.json({
      success: true,
      data: shifts,
      date: today,
      total: shifts.length
    });
  } catch (err) {
    console.error("getTodayShifts error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};