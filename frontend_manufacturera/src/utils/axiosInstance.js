import axios from 'axios';

const API_BASE_URL = 'http://backend:8000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    headers: {
        'Accept': 'application/json',
    },
});

// To prevent applying interceptors multiple times
let requestInterceptorId = null;

export const setupAxiosInterceptors = (authToken, tenantId) => {
    // Eject the old interceptor before applying a new one
    if (requestInterceptorId !== null) {
        axiosInstance.interceptors.request.eject(requestInterceptorId);
    }

    requestInterceptorId = axiosInstance.interceptors.request.use(
        config => {
            if (authToken?.access) {
                config.headers.Authorization = `Bearer ${authToken.access}`;
            }
            if (tenantId) {
                config.headers['X-Tenant-ID'] = tenantId;
            }
            return config;
        },
        error => {
            return Promise.reject(error);
        }
    );
};


axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            // We read from localStorage here because this logic is outside of React's context lifecycle
            const currentAuthToken = localStorage.getItem('authToken') ? JSON.parse(localStorage.getItem('authToken')) : null;
            if (currentAuthToken?.refresh) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                        refresh: currentAuthToken.refresh,
                    });
                    const newAuthToken = { ...currentAuthToken, access: response.data.access };
                    localStorage.setItem('authToken', JSON.stringify(newAuthToken));
                    
                    // Manually update the header of the original request
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

                    // Also update the interceptor for subsequent requests in this session
                    const tenantId = localStorage.getItem('tenantId');
                    setupAxiosInterceptors(newAuthToken, tenantId);
                    
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('tenantId');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                localStorage.removeItem('authToken');
                localStorage.removeItem('tenantId');
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
