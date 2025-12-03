import apiClient from "../apiClient";

export const employeeService = {
  // Dashboard
  getDashboard: () => apiClient.get("/api/employee/dashboard"),

  // Reports
  getMyReports: (params) => apiClient.get("/api/employee/reports", { params }),
};