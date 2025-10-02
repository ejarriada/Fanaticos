import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppBar, IconButton, Button, Box } from '@mui/material';
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
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
        >
            <Box className="navbar-content">
                <IconButton
                    color="inherit"
                    onClick={handleDrawerToggle}
                    className="navbar-menu-button"
                >
                    <MenuIcon />
                </IconButton>

                <span className="navbar-title">ERP Manufactura</span>

                <Box className="navbar-spacer" />

                {user && (
                    <Box className="navbar-user-box">
                        <PersonIcon className="navbar-user-icon" />
                        <span className="navbar-user-name">
                            {user.first_name || user.email?.split('@')[0] || 'Usuario'}
                        </span>
                    </Box>
                )}

                <Button
                    color="inherit"
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                    className="navbar-logout-button"
                >
                    Salir
                </Button>
            </Box>
        </AppBar>
    );
};

export default Navbar;