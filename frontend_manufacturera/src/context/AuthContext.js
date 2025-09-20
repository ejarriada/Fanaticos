import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setupAxiosInterceptors } from '../utils/axiosInstance'; // IMPORT THE SETUP FUNCTION

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [isAuthLoading, setAuthLoading] = useState(true);

    // This effect syncs the axios interceptor with the auth state
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
        const response = await fetch('http://localhost:8000/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': tenant,
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            setAuthToken(data);
            setUser(jwtDecode(data.access));
            setTenantId(tenant);
            localStorage.setItem('authToken', JSON.stringify(data));
            localStorage.setItem('tenantId', tenant);
            return { success: true };
        } else {
            return { success: false, error: data.detail || 'Login failed' };
        }
    };

    const logout = () => {
        setAuthToken(null);
        setUser(null);
        setTenantId(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('tenantId');
    };

    // This token refresh logic can be simplified or removed if the response interceptor handles it well
    // For now, let's keep it as a backup.
    useEffect(() => {
        const updateToken = async () => {
            if (!authToken) return;

            try {
                const response = await fetch('http://localhost:8000/api/token/refresh/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Tenant-ID': tenantId,
                    },
                    body: JSON.stringify({ refresh: authToken.refresh }),
                });

                const data = await response.json();

                if (response.ok) {
                    const newAuthToken = { ...authToken, access: data.access };
                    setAuthToken(newAuthToken);
                    setUser(jwtDecode(data.access));
                    localStorage.setItem('authToken', JSON.stringify(newAuthToken));
                } else {
                    logout();
                }
            } catch (error) {
                console.error("Token refresh failed:", error);
                logout();
            }
        };

        const fiveMinutes = 1000 * 60 * 5;
        let interval = setInterval(() => {
            if (authToken) {
                updateToken();
            }
        }, fiveMinutes);
        return () => clearInterval(interval);
    }, [authToken, tenantId]);

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
