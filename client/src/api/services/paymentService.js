import apiClient from "../apiClient";

export const initiatePayment = async (planId) => {
    const response = await apiClient.post("/api/pay", { plan_id: planId });
    return response.data;
};

// New: Get Billing History
export const getBillingHistory = async () => {
    const response = await apiClient.get("/api/payment/history");
    return response.data;
};

export const paymentService = {
    initiatePayment,
    checkPaymentStatus: async (orderId) => {
        const response = await apiClient.get(`/api/paymentStatus/${orderId}`);
        return response.data;
    },
    getBillingHistory,
};
