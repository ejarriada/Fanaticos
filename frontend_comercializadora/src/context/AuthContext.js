import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') ? JSON.parse(localStorage.getItem('authToken')) : null);
    const [user, setUser] = useState(() => authToken ? jwtDecode(authToken.access) : null);
    const [tenantId, setTenantId] = useState(() => localStorage.getItem('tenantId'));

    const login = async (email, password, tenant) => {
        const response = await fetch('http://localhost:8000/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': tenant, // Use the tenant ID passed to the function
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

    const updateToken = async () => {
        if (!authToken) return;

        const response = await fetch('http://localhost:8000/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
            logout(); // Refresh token failed, log out user
        }
    };

    useEffect(() => {
        const fiveMinutes = 1000 * 60 * 5;
        let interval = setInterval(() => {
            if (authToken) {
                updateToken();
            }
        }, fiveMinutes);
        return () => clearInterval(interval);
    }, [authToken]);

    const contextData = {
        user,
        authToken,
        tenantId, // Expose tenantId
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