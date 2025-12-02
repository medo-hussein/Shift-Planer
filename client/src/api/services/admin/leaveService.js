import apiClient from "../../apiClient";

export const leaveService = {
  submitRequest: (data) => apiClient.post("/api/admin/leave-requests/submit", data),

  getEmployeeRequests: (status) => 
    apiClient.get("/api/admin/leave-requests", { params: { status } }),

  updateRequestStatus: (requestId, status, notes) => 
    apiClient.patch(`/api/admin/leave-requests/${requestId}/status`, { status, admin_notes: notes }),
  getMyRequests: () => apiClient.get("/api/admin/leave-requests/me"),
};