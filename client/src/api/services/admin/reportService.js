import apiClient from "../../apiClient";

export const reportService = {
  getAll: (params) => apiClient.get("/api/admin/reports", { params }),

  getStats: () => apiClient.get("/api/admin/reports/dashboard-stats"),

  generateAttendance: (data) => apiClient.post("/api/admin/reports/attendance", data),
  generateShift: (data) => apiClient.post("/api/admin/reports/shift", data),
  generatePerformance: (data) => apiClient.post("/api/admin/reports/performance", data),
  
  delete: (id) => apiClient.delete(`/api/admin/reports/${id}`),
  
  share: (id, userIds) => apiClient.post(`/api/admin/reports/${id}/share`, { user_ids: userIds })
};