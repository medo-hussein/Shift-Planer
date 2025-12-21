import apiClient from "../apiClient";

export const planService = {
    getAllPlans: async () => {
        const response = await apiClient.get("/api/plans/admin/all");
        return response.data;
    },
    getPlans: async () => {
        const response = await apiClient.get("/api/plans");
        return response.data;
    },
    createPlan: (data) => apiClient.post("/api/plans", data),
    updatePlan: (id, data) => apiClient.put(`/api/plans/${id}`, data),
    togglePlanStatus: (id) => apiClient.patch(`/api/plans/${id}/status`),
    deletePlanPermanent: (id) => apiClient.delete(`/api/plans/${id}/permanent`),
};
