import apiClient from "../apiClient";

export const planService = {
    getPlans: async () => {
        const response = await apiClient.get("/api/plans");
        return response.data;
    },
    createPlan: (data) => apiClient.post("/api/plans", data),
    updatePlan: (id, data) => apiClient.put(`/api/plans/${id}`, data),
    deletePlan: (id) => apiClient.delete(`/api/plans/${id}`),
};
