import apiClient from "../apiClient";

export const superAdminService = {
  // 1. Dashboard
  getDashboardStats: () => apiClient.get("/api/super-admin/dashboard"),

  // 2. Branch Management
  getAllBranches: (params) => apiClient.get("/api/super-admin/branches", { params }),
  createBranchAdmin: (data) => apiClient.post("/api/auth/create-admin", data),
    updateBranch: (id, data) => apiClient.put(`/api/super-admin/branches/${id}`, data),
  deleteBranch: (id) => apiClient.delete(`/api/users/${id}`),

  // 3. Employee Management
  transferEmployee: (data) => apiClient.post("/api/super-admin/employees/transfer", data),
  getBranchEmployees: (branchAdminId) => 
    apiClient.get(`/api/users/branch/employees`, { params: { branch_admin_id: branchAdminId } }),

  // 4. Reports
  getSystemReports: (params) => apiClient.get("/api/super-admin/reports/system", { params }),
  
};