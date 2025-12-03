import apiClient from "../../apiClient";

export const attendanceService = {
  getBranchAttendance: (date) => apiClient.get("/api/attendance/branch", { params: { date } }),
  
  getEmployeeAttendance: (employeeId) => apiClient.get(`/api/attendance/employee/${employeeId}`),
};