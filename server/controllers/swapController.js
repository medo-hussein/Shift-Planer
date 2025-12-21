import SwapRequest from "../models/swapRequestModel.js";
import Shift from "../models/shiftModel.js";
import User from "../models/userModel.js";
import { createNotification } from "./notificationController.js";

// Utility to get tenant owner
const getTenantOwnerId = (user) => {
  return user.role === "super_admin" ? user._id : user.super_admin_id;
};

// 1. Create a Swap Request (Employee)
export const createSwapRequest = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user);
    const { shift_id, target_employee_id, target_shift_id, reason } = req.body;

    // Verify shift ownership
    const shift = await Shift.findOne({
      _id: shift_id,
      employee_id: requesterId,
    });
    if (!shift) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Shift not found or does not belong to you.",
        });
    }

    // Determine Branch Admin (The one who needs to approve later)
    // We assume the branch admin is the one who created the shift or the user's direct admin
    const branchAdminId = req.user.branch_admin_id || shift.created_by_admin_id;

    // Create the request
    const swapRequest = await SwapRequest.create({
      requester_id: requesterId,
      shift_id: shift_id,
      target_employee_id: target_employee_id || null, // If null, it's an "Open Shift" offer
      target_shift_id: target_shift_id || null, // If null, it's a "Give Away"
      branch_admin_id: branchAdminId,
      super_admin_id: tenantOwnerId,
      status: "pending",
      reason: reason || "",
    });

    // Notify Target Employee (if specific)
    if (target_employee_id) {
      await createNotification({
        recipientId: target_employee_id,
        senderId: requesterId,
        superAdminId: tenantOwnerId,
        title: "Shift Swap Request",
        message: `${req.user.name} wants to swap a shift with you.`,
        type: "info",
        link: "/swaps",
      });
    }

    // If it's an Open Shift (no target), you might want to notify all branch employees (Optional/Advanced)

    return res
      .status(201)
      .json({
        success: true,
        message: "Swap request created",
        data: swapRequest,
      });
  } catch (err) {
    console.error("createSwapRequest error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get My Requests (Incoming & Outgoing) - Employee
export const getMySwapRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Outgoing: Requests I sent
    const outgoing = await SwapRequest.find({ requester_id: userId })
      .populate("shift_id target_employee_id target_shift_id")
      .sort({ createdAt: -1 });

    // Incoming: Requests sent to me OR Open Shifts in my branch
    // For Open Shifts: target_employee_id is null AND branch matches
    const incoming = await SwapRequest.find({
      $or: [
        { target_employee_id: userId }, // Direct request
        {
          target_employee_id: null, // Open shift
          branch_admin_id: req.user.branch_admin_id, // Same branch
          requester_id: { $ne: userId }, // Not my own request
        },
      ],
      status: "pending", // Only show pending offers
    })
      .populate("requester_id", "name email")
      .populate("shift_id")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { outgoing, incoming } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Accept Swap Request (Colleague)
export const acceptSwapRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params; // Request ID

    const request = await SwapRequest.findById(id);
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    // 1. Check eligibility
    if (
      request.target_employee_id &&
      request.target_employee_id.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "This request is not for you." });
    }

    // 2. CONFLICT CHECK: Check if I already have a shift on that day
    const shiftToSwap = await Shift.findById(request.shift_id);
    if (!shiftToSwap) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Shift associated with this request not found.",
        });
    }

    const shiftDate = new Date(shiftToSwap.start_date_time);
    const startOfDay = new Date(shiftDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(shiftDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query to find conflicting shifts
    const conflictQuery = {
      employee_id: userId,
      status: { $nin: ["cancelled", "no_show"] }, // Ignore cancelled shifts
      start_date_time: { $gte: startOfDay, $lte: endOfDay },
    };

    // Important: If the swap involves giving up my specific shift (Target Shift),
    // that specific shift shouldn't count as a conflict because I'm trading it away.
    if (request.target_shift_id) {
      conflictQuery._id = { $ne: request.target_shift_id };
    }

    const myConflictingShift = await Shift.findOne(conflictQuery);

    if (myConflictingShift) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot accept this request because you already have a shift on this day.",
      });
    }

    // 3. Proceed with acceptance
    // If it was an open shift (target is null), assign this user as the target now
    if (!request.target_employee_id) {
      request.target_employee_id = userId;
    }

    // Update status
    request.status = "accepted"; // Now waiting for Admin approval
    await request.save();

    // 4. Notifications
    // Notify Original Requester
    await createNotification({
      recipientId: request.requester_id,
      senderId: userId,
      superAdminId: request.super_admin_id,
      title: "Swap Accepted",
      message: "Your swap request was accepted. Waiting for Admin approval.",
      type: "success",
      link: "/swaps",
    });

    // Notify Admin
    await createNotification({
      recipientId: request.branch_admin_id,
      senderId: userId,
      superAdminId: request.super_admin_id,
      title: "Swap Approval Needed",
      message: "A shift swap is pending your approval.",
      type: "warning",
      link: "/swaps", // Corrected link for Admin
    });

    return res.json({
      success: true,
      message: "Request accepted. Waiting for manager approval.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Admin Approve (The actual swap happens here!)
export const approveSwapRequest = async (req, res) => {
  try {
    // Admin only check
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { id } = req.params;
    const request = await SwapRequest.findById(id);

    if (!request || request.status !== "accepted") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Request not found or not in 'accepted' state.",
        });
    }

    // --- PERFORM THE SWAP ---

    // 1. Get the original shift
    const originalShift = await Shift.findById(request.shift_id);
    if (!originalShift)
      return res.status(404).json({ message: "Original shift not found" });

    // 2. Swap logic
    if (request.target_shift_id) {
      // Case A: Swap Shift for Shift
      const targetShift = await Shift.findById(request.target_shift_id);
      if (targetShift) {
        // Swap employees
        const temp = originalShift.employee_id;
        originalShift.employee_id = targetShift.employee_id;
        targetShift.employee_id = temp;

        await targetShift.save();
      }
    } else {
      // Case B: Give away (or Open Shift picked up)
      // Assign original shift to the target employee
      originalShift.employee_id = request.target_employee_id;
    }

    await originalShift.save();

    // 3. Update Request Status
    request.status = "approved";
    await request.save();

    // 4. Notify both parties
    const notificationData = {
      superAdminId: request.super_admin_id,
      title: "Swap Approved",
      message: "Your shift swap request has been approved by the manager.",
      type: "success",
      link: "/schedule",
    };

    // Notify Requester
    await createNotification({
      ...notificationData,
      recipientId: request.requester_id,
    });
    // Notify Target
    await createNotification({
      ...notificationData,
      recipientId: request.target_employee_id,
    });

    return res.json({
      success: true,
      message: "Swap approved and schedule updated.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Reject Request (Colleague or Admin)
export const rejectSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await SwapRequest.findById(id);

    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "rejected";
    await request.save();

    // Notify requester
    await createNotification({
      recipientId: request.requester_id,
      senderId: req.user._id,
      superAdminId: request.super_admin_id,
      title: "Swap Rejected",
      message: "Your swap request was rejected.",
      type: "error",
      link: "/swaps",
    });

    return res.json({ success: true, message: "Request rejected." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Get Branch Requests (For Admin Dashboard)
export const getBranchSwapRequests = async (req, res) => {
  try {
    // Admin only
    if (!["admin", "super_admin"].includes(req.user.role))
      return res.status(403).json({ message: "Denied" });

    const adminId = req.user._id;
    const tenantOwnerId = getTenantOwnerId(req.user);

    let query = {
      super_admin_id: tenantOwnerId,
      status: { $in: ["accepted", "approved", "rejected"] }, // Admins usually care about 'accepted' ones to approve
    };

    if (req.user.role === "admin") {
      query.branch_admin_id = adminId;
    }

    const requests = await SwapRequest.find(query)
      .populate("requester_id", "name email")
      .populate("target_employee_id", "name email")
      .populate("shift_id", "start_date_time end_date_time title")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
