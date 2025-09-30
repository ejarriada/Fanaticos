import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, IconButton, Typography, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = ({ handleDrawerToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                width: '100%', // CAMBIO: siempre 100%, no se ajusta al sidebar
                zIndex: (theme) => theme.zIndex.drawer + 1, // CAMBIO: navbar sobre el sidebar
                height: '64px',
                minHeight: '48px',
            }}
        >
            <Toolbar 
                sx={{ 
                    minHeight: '48px !important',
                    height: '64px',
                    px: 2
                }}
            >
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, p: 1 }}
                    size="small"
                >
                    <MenuIcon fontSize="small" />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {/* Espacio vacío */}
                </Typography>
                {user && (
                    <Typography 
                        variant="body2" 
                        sx={{ mr: 2, fontSize: '0.875rem' }}
                    >
                        Bienvenido, {user.email}
                    </Typography>
                )}
                <Button 
                    color="inherit" 
                    onClick={handleLogout}
                    size="small"
                    sx={{ fontSize: '0.875rem', py: 0.5 }}
                >
                    Cerrar Sesión
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;