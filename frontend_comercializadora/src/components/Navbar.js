import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, IconButton, Typography, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = ({ drawerWidth, handleDrawerToggle, sidebarOpen }) => {
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
                width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
                ml: { sm: `${sidebarOpen ? drawerWidth : 0}px` },
                transition: (theme) =>
                    theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {/* No text here, as per user request */}
                </Typography>
                {user && <Typography variant="subtitle1" sx={{ mr: 2 }}>Bienvenido, {user.email}</Typography>}
                <Button color="inherit" onClick={handleLogout}>Cerrar Sesión</Button>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;