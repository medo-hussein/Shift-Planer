import apiClient from "../apiClient";

export const platformService = {
    getDashboardStats: () => apiClient.get("/api/platform/dashboard"),
    getAllCompanies: (page = 1, limit = 10, search = "", plan = "", status = "") =>
        apiClient.get(`/api/platform/companies?page=${page}&limit=${limit}&search=${search}&plan=${plan}&status=${status}`),

    getCompanyDetails: (id) => apiClient.get(`/api/platform/companies/${id}`),

    toggleCompanyStatus: (id) => apiClient.patch(`/api/platform/companies/${id}/status`),
};
