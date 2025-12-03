import LeaveRequest from "../models/leaveRequestModel.js";
import User from "../models/userModel.js";
// ✅ 1. استيراد دالة إنشاء الإشعار
import { createNotification } from "./notificationController.js"; 

// Utility function to get the Super Admin ID (Tenant Owner ID)
const getTenantOwnerId = (user) => {
    return user.role === "super_admin" ? user._id : user.super_admin_id;
};

// 1. Submit a new leave request
export const createLeaveRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const tenantOwnerId = getTenantOwnerId(req.user);

    let approverId;

    if (userRole === 'employee') {
        approverId = req.user.branch_admin_id;
        if (!approverId) {
            return res.status(400).json({ success: false, message: "Employee must belong to a branch admin to submit a request." });
        }
    } else if (userRole === 'admin') {
        approverId = tenantOwnerId; 
        if (!approverId) {
             return res.status(500).json({ success: false, message: "Admin account is not linked to a Super Admin." });
        }
    } else {
        return res.status(403).json({ success: false, message: "Only employees and admins can submit leave requests." });
    }

    const { leave_type, start_date, end_date, reason, is_half_day = false } = req.body;

    const start = new Date(start_date);
    const end = new Date(end_date);
    
    if (isNaN(start) || isNaN(end) || start > end) {
        return res.status(400).json({ success: false, message: "Invalid date range." });
    }
    
    // Check for overlapping requests
    const overlappingRequest = await LeaveRequest.findOne({
        employee_id: userId, 
        super_admin_id: tenantOwnerId,
        status: { $in: ['pending', 'approved'] },
        start_date: { $lte: end },
        end_date: { $gte: start }
    });

    if (overlappingRequest) {
        return res.status(400).json({ 
            success: false, 
            message: "Request overlaps with an existing pending or approved request."
        });
    }

    const request = await LeaveRequest.create({
      employee_id: userId,
      super_admin_id: tenantOwnerId,
      branch_admin_id: approverId,
      leave_type,
      start_date: start,
      end_date: end,
      reason,
      is_half_day,
    });

    // ✅ 2. إرسال إشعار للمدير (Approver)
    if (approverId) {
      await createNotification({
        recipientId: approverId,
        senderId: userId,
        superAdminId: tenantOwnerId,
        title: "New Leave Request",
        message: `${req.user.name} has requested a ${leave_type} leave from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`,
        type: "info",
        link: "/time-off" // رابط صفحة الإجازات عند المدير
      });
    }

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully for review.",
      data: request,
    });
  } catch (err) {
    console.error("createLeaveRequest error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Employee/Admin gets their own submitted requests
export const getMyLeaveRequests = async (req, res) => {
    try {
        const employeeId = req.user._id;
        const tenantOwnerId = getTenantOwnerId(req.user);
        const { status, page = 1, limit = 10 } = req.query;

        let query = {
            employee_id: employeeId,
            super_admin_id: tenantOwnerId,
        };

        if (status) query.status = status;

        const requests = await LeaveRequest.find(query)
            .populate('branch_admin_id', 'name') 
            .sort({ start_date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await LeaveRequest.countDocuments(query);

        return res.json({
            success: true,
            data: requests,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, total_pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        console.error("getMyLeaveRequests error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Admin/Super Admin gets requests they need to approve
export const getApprovalRequests = async (req, res) => {
    try {
        const approverId = req.user._id;
        const userRole = req.user.role;
        const tenantOwnerId = getTenantOwnerId(req.user);
        const { status, page = 1, limit = 10 } = req.query;

        let query = {
            branch_admin_id: approverId, 
            super_admin_id: tenantOwnerId, // Tenant isolation
        };

        if (userRole === 'admin' || userRole === 'super_admin') {
            query.status = status || 'pending';
        } else {
             return res.status(403).json({ success: false, message: "Admin access required." });
        }
        
        const requests = await LeaveRequest.find(query)
            .populate('employee_id', 'name email role branch_name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await LeaveRequest.countDocuments(query);

        return res.json({
            success: true,
            data: requests,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, total_pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        console.error("getApprovalRequests error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Admin/Super Admin updates a request status
export const updateRequestStatus = async (req, res) => {
    try {
        const approverId = req.user._id;
        const userRole = req.user.role;
        const tenantOwnerId = getTenantOwnerId(req.user);
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        if (!['approved', 'rejected', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value." });
        }

        const request = await LeaveRequest.findOne({
            _id: id,
            branch_admin_id: approverId,
            super_admin_id: tenantOwnerId, // Tenant isolation
            status: { $in: ['pending', 'approved'] }
        });

        if (!request) {
            return res.status(404).json({ success: false, message: "Leave request not found or not authorized for approval." });
        }
        
        request.status = status;
        request.approved_by = approverId;
        request.admin_notes = admin_notes || request.admin_notes;

        await request.save();

        await createNotification({
            recipientId: request.employee_id,
            senderId: approverId,
            superAdminId: tenantOwnerId,
            title: "Leave Request Update",
            message: `Your leave request has been ${status.toUpperCase()}. ${admin_notes ? `Note: ${admin_notes}` : ""}`,
            type: status === 'approved' ? "success" : "error",
            link: "/time-off" // رابط صفحة الإجازات عند الموظف
        });
        
        return res.json({
            success: true,
            message: `Request ${status} successfully.`,
            data: request
        });
    } catch (err) {
        console.error("updateRequestStatus error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ 5. Employee cancels their own pending request (NEW FUNCTION)
export const cancelLeaveRequest = async (req, res) => {
    try {
      const userId = req.user._id;
      const { id } = req.params;
  
      const request = await LeaveRequest.findOne({
        _id: id,
        employee_id: userId,
        status: "pending"
      });
  
      if (!request) {
        return res.status(404).json({ 
          success: false, 
          message: "Request not found or cannot be cancelled (only pending requests can be cancelled)." 
        });
      }
  
      request.status = "cancelled";
      await request.save();
  
      return res.json({
        success: true,
        message: "Leave request cancelled successfully.",
        data: request
      });
  
    } catch (err) {
      console.error("cancelLeaveRequest error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
};