import apiClient from "../../apiClient";

export const swapService = {
  getBranchRequests: () => apiClient.get("/api/swaps/admin"),

  approveRequest: (id) => apiClient.put(`/api/swaps/${id}/approve`),

  rejectRequest: (id) => apiClient.put(`/api/swaps/${id}/reject`),
};