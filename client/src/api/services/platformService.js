import apiClient from "../apiClient";

export const platformService = {
    getDashboardStats: () => apiClient.get("/api/platform/dashboard"),
    getAllCompanies: () => apiClient.get("/api/platform/companies"),
    toggleCompanyStatus: (id) => apiClient.patch(`/api/platform/companies/${id}/status`),
};
