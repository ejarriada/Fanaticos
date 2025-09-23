import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { setupAxiosInterceptors } from '../utils/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [isAuthLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        setupAxiosInterceptors(authToken, tenantId);
    }, [authToken, tenantId]);

    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedToken = localStorage.getItem('authToken');
                const storedTenantId = localStorage.getItem('tenantId');

                if (storedToken && storedTenantId) {
                    const token = JSON.parse(storedToken);
                    if (jwtDecode(token.access).exp * 1000 > Date.now()) {
                        setAuthToken(token);
                        setUser(jwtDecode(token.access));
                        setTenantId(storedTenantId);
                    } else {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('tenantId');
                    }
                }
            } catch (error) {
                console.error("Failed to initialize auth:", error);
                localStorage.removeItem('authToken');
                localStorage.removeItem('tenantId');
            } finally {
                setAuthLoading(false);
            }
        };
        initializeAuth();
    }, []);

    const login = async (email, password, tenant) => {
        try {
            const response = await axios.post('http://localhost:8000/api/token/', { email, password }, {
                headers: { 'X-Tenant-ID': tenant }
            });
            const data = response.data;
            setAuthToken(data);
            setUser(jwtDecode(data.access));
            setTenantId(tenant);
            localStorage.setItem('authToken', JSON.stringify(data));
            localStorage.setItem('tenantId', tenant);
            return { success: true };
        } catch (error) {
            const errorDetail = error.response?.data?.detail || 'Login failed';
            return { success: false, error: errorDetail };
        }
    };

    const logout = () => {
        setAuthToken(null);
        setUser(null);
        setTenantId(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('tenantId');
    };

    const contextData = {
        user,
        authToken,
        tenantId,
        isAuthLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
