import apiClient from "../apiClient";

export const superAdminService = {
  // Dashboard
  getDashboardStats: () => apiClient.get("/api/super-admin/dashboard"),

  // Branch Management
  getAllBranches: (params) => apiClient.get("/api/super-admin/branches", { params }),
  createBranchAdmin: (data) => apiClient.post("/api/super-admin/branches", data),
  updateBranch: (id, data) => apiClient.put(`/api/super-admin/branches/${id}`, data),
  deleteBranch: (id) => apiClient.delete(`/api/users/${id}`),

  // Employee Management (Transfer & CRUD)
  transferEmployee: (data) => apiClient.post("/api/super-admin/employees/transfer", data),
  getBranchEmployees: (branchAdminId) =>
    apiClient.get(`/api/users/branch/employees`, { params: { branch_admin_id: branchAdminId } }),

  // ✅ الإضافات الجديدة لإدارة الموظفين (إضافة، تعديل، حذف)
  createEmployee: (data) => apiClient.post("/api/users/employees", data),
  updateEmployee: (id, data) => apiClient.put(`/api/users/${id}`, data),
  deleteEmployee: (id) => apiClient.delete(`/api/users/${id}`),

  // Reports
  getSystemReports: (params) => apiClient.get("/api/super-admin/reports/system", { params }),

  // 5. Leave Management (Time Off)
  getLeaveRequests: (status, page = 1, limit = 10) =>
    apiClient.get("/api/super-admin/leave-requests", { params: { status, page, limit } }),

  updateLeaveStatus: (requestId, status, adminNotes) =>
    apiClient.patch(`/api/super-admin/leave-requests/${requestId}/status`, {
      status,
      admin_notes: adminNotes
    }),
};