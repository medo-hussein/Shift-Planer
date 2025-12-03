import axios from "axios";

const BASE_URL = "http://localhost:5000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Add access token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
    console.log("sending request with token:", localStorage.getItem("accessToken"));

  return config;
});

// Handle refresh token logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try refreshing token
        const { data } = await axios.get(
          `${BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (data?.accessToken) {
          const newToken = data.accessToken;
          localStorage.setItem("accessToken", newToken);

          // Update header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Fetch fresh user data & notify AuthProvider
          try {
            const me = await axios.get(`${BASE_URL}/api/users/me`, {
              headers: { Authorization: `Bearer ${newToken}` },
              withCredentials: true,
            });

            window.dispatchEvent(
              new CustomEvent("auth-update", { detail: me.data })
            );
          // eslint-disable-next-line no-unused-vars
          } catch (err) {
            console.error("Failed to refresh user data.");
          }

          return apiClient(originalRequest);
        }

        // No token returned → force logout
        localStorage.removeItem("accessToken");
        window.location.href = "/login";

      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
