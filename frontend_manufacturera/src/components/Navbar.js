import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, IconButton, Typography, Button, Box, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import './Navbar.css';

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
                width: '100%',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                height: '56px',
                minHeight: '56px',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
        >
            <Toolbar 
                sx={{ 
                    px: 2,
                    gap: 2,
                }}
            >
                {/* Botón menú hamburguesa */}
                <IconButton
                    color="inherit"
                    aria-label="abrir menú"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ 
                        p: 0.75,
                        mt: 0,
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }
                    }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Logo/Título */}
                <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        fontSize: '1.1rem',
                        lineHeight: '40px', // Altura específica
                    }}
                >
                    ERP Manufactura
                </Typography>

                {/* Espaciador flexible */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Información del usuario */}
                {user && (
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',  // CAMBIAR de 24px a 20px
                            px: 1.5,  // CAMBIAR de 2 a 1.5
                            py: 0.25,  // CAMBIAR de 0.5 a 0.25
                            height: '40px',  // AGREGAR - altura fija
                        }}
                    >
                        <Avatar 
                            sx={{ 
                                width: 28,  // CAMBIAR de 32 a 28
                                height: 28,  // CAMBIAR de 32 a 28
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                            }}
                        >
                            <PersonIcon fontSize="small" />
                        </Avatar>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                fontSize: '0.875rem',  // CAMBIAR de 0.9rem a 0.875rem
                                fontWeight: 500,
                                lineHeight: 1,  // AGREGAR
                            }}
                        >
                            {user.first_name || user.email?.split('@')[0] || 'Usuario'}
                        </Typography>
                    </Box>
                )}

                {/* Botón cerrar sesión */}
                <Button 
                    color="inherit" 
                    onClick={handleLogout}
                    startIcon={<LogoutIcon fontSize="small" />}  // AGREGAR fontSize
                    sx={{ 
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        borderRadius: '8px',
                        px: 1.5,  // CAMBIAR de 2 a 1.5
                        py: 0.5,  // AGREGAR
                        minHeight: '36px',  // AGREGAR
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }
                    }}
                >
                    Salir
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;