import apiClient from "../../apiClient";

export const employeesService = {

    getEmployees: (params) => apiClient.get("/api/admin/employees", { params }),
    getEmployee: (employeeId) => apiClient.get(`/api/admin/employees/${employeeId}`),
    createEmployee: (data) => apiClient.post("/api/admin/employees", data),
    updateEmployee: (employeeId, data) => apiClient.put(`/api/admin/employees/${employeeId}`, data),
    toggleEmployeeStatus: (employeeId, data) => apiClient.patch(`/api/users/employees/${employeeId}/status`, data),
    getEmployeeAttendance: (employeeId) => apiClient.get(`/api/attendance/employee/${employeeId}`),
    deleteEmployee: (employeeId) => apiClient.delete(`/api/admin/employees/${employeeId}`),

};
