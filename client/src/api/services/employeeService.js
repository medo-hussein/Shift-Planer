import apiClient from "../apiClient";

export const employeeService = {
  // Dashboard
  getDashboard: () => apiClient.get("/api/employee/dashboard"),

  // Reports
  getMyReports: (params) => apiClient.get("/api/employee/reports", { params }),

  // Swap Shifts
  getColleagues: () => apiClient.get("/api/employee/colleagues"),
  
  // New: Get colleague shifts for exchange (Shift-for-Shift)
  getColleagueShifts: (colleagueId) => apiClient.get(`/api/employee/colleagues/${colleagueId}/shifts`),

  createSwapRequest: (data) => apiClient.post("/api/swaps", data),
  getMySwapRequests: () => apiClient.get("/api/swaps"),
  acceptSwapRequest: (id) => apiClient.put(`/api/swaps/${id}/accept`),
  rejectSwapRequest: (id) => apiClient.put(`/api/swaps/${id}/reject`),
};