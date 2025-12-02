import apiClient from "../../apiClient";

export const dashboardService = {
    getDashboard: () => apiClient.get("/api/admin/dashboard"),
    getDashboardStats : () => apiClient.get("/api/reports/dashboard-stats")

};
