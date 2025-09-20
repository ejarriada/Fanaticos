import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [currentTenantId, setCurrentTenantId] = useState(null);
    const [loadingTenant, setLoadingTenant] = useState(true);

    useEffect(() => {
        const fetchTenantId = async () => {
            const tenantName = process.env.REACT_APP_TENANT_NAME;
            if (!tenantName) {
                setError('Tenant name environment variable not configured.');
                setLoadingTenant(false);
                return;
            }
            try {
                const response = await fetch(`http://localhost:8000/api/tenants/?name=${tenantName}`);
                const data = await response.json();
                if (response.ok && data && data.length > 0) {
                    setCurrentTenantId(data[0].id);
                } else {
                    setError(`Tenant with name "${tenantName}" not found.`);
                }
            } catch (err) {
                setError('Failed to fetch tenant ID.');
            } finally {
                setLoadingTenant(false);
            }
        };
        fetchTenantId();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (loadingTenant) {
            setError('Tenant ID is still loading. Please wait.');
            return;
        }
        if (!currentTenantId) {
            setError('Tenant ID not available. Cannot log in.');
            return;
        }
        const result = await login(email, password, currentTenantId);
        if (result.success) {
            navigate('/'); // Redirect to home or dashboard after successful login
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="login-page">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
};

export default LoginPage;
