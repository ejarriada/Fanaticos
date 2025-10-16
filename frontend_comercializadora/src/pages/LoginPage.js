import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Email,
    Lock
} from '@mui/icons-material';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
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
                const response = await axios.get(`http://localhost:8000/api/tenants/?name=${tenantName}`);
                const data = response.data;
                if (data && data.length > 0) {
                    setCurrentTenantId(data[0].id);
                } else {
                    setError(`Tenant with name "${tenantName}" not found.`);
                }
            } catch (err) {
                setError('Failed to fetch tenant ID.');
                console.error("Error fetching tenant ID:", err);
            } finally {
                setLoadingTenant(false);
            }
        };
        fetchTenantId();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (loadingTenant) {
            setError('Tenant ID is still loading. Please wait.');
            setIsLoading(false);
            return;
        }
        if (!currentTenantId) {
            setError('Tenant ID not available. Cannot log in.');
            setIsLoading(false);
            return;
        }

        const result = await login(email, password, currentTenantId);
        
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    if (loadingTenant) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #2eaa22ff 100%)',
                padding: 2
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={10}
                    sx={{
                        padding: { xs: 3, sm: 5 },
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    {/* Logo y Título */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        {/* Logo - Cambia a logo.jpeg */}
                        <Box
                            component="img"
                            src="/logo.png"
                            alt="Logo"
                            sx={{
                                width: 120,
                                height: 'auto',
                                mb: 2
                            }}
                        />

                        <Typography
                            variant="h4"
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #667eea 0%, #2eaa22ff 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: 1
                            }}
                        >
                            Bienvenido
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            Sistema de Gestión Comercial
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Ingresa tus credenciales para continuar
                        </Typography>
                    </Box>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {error && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                label="Correo Electrónico"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'white'
                                    }
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={handleTogglePasswordVisibility}
                                                edge="end"
                                                aria-label="toggle password visibility"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'white'
                                    }
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isLoading}
                                sx={{
                                    mt: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #667eea 0%, #2eaa22ff 100%)',
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5568d3 0%, #2eaa22ff 100%)',
                                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                                    },
                                    '&:disabled': {
                                        background: '#ccc'
                                    }
                                }}
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} sx={{ color: 'white' }} />
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </Button>
                        </Box>
                    </form>

                    {/* Footer */}
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            © 2025 Sistema de Gestión. Todos los derechos reservados.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default LoginPage;