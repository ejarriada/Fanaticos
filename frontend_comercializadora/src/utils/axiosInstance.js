import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    headers: {
        'Accept': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    async config => {
        const authToken = localStorage.getItem('authToken') ? JSON.parse(localStorage.getItem('authToken')) : null;
        if (authToken?.access) {
            config.headers.Authorization = `Bearer ${authToken.access}`;
        }
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
            config.headers['X-Tenant-ID'] = tenantId;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const authToken = localStorage.getItem('authToken') ? JSON.parse(localStorage.getItem('authToken')) : null;
            if (authToken?.refresh) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                        refresh: authToken.refresh,
                    });
                    const newAuthToken = { ...authToken, access: response.data.access };
                    localStorage.setItem('authToken', JSON.stringify(newAuthToken));
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    // Refresh token failed, logout user
                    localStorage.removeItem('authToken');
                    window.location.href = '/login'; // Redirect to login page
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, logout user
                localStorage.removeItem('authToken');
                window.location.href = '/login'; // Redirect to login page
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
