import React from 'react';
import { Link } from 'react-router-dom';
import {
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BarChartIcon from '@mui/icons-material/BarChart';

const Sidebar = ({ open, drawerWidth }) => {
    // Lista de modulos de COMERCIALIZADORA
    const modules = [
        { text: 'Ventas', icon: <PointOfSaleIcon />, path: '/sales' },
        { text: 'Remitos Internos', icon: <LocalShippingIcon />, path: '/internal-delivery-notes' },
        { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory' },
        { text: 'Reservas de Productos', icon: <InventoryIcon />, path: '/product-reservations' },
        { text: 'Reservas de Productos', icon: <InventoryIcon />, path: '/product-reservations' },
        { text: 'Reservas de Productos', icon: <InventoryIcon />, path: '/product-reservations' },
        { text: 'Reservas de Productos', icon: <InventoryIcon />, path: '/product-reservations' },
        { text: 'Promociones', icon: <MonetizationOnIcon />, path: '/promotions' },
        { text: 'Tarjetas de Fidelidad', icon: <MonetizationOnIcon />, path: '/loyalty-cards' },
        { text: 'Ventas E-commerce', icon: <PointOfSaleIcon />, path: '/ecommerce-sales' },
        { text: 'Ventas E-commerce', icon: <PointOfSaleIcon />, path: '/ecommerce-sales' },
        { text: 'Ventas E-commerce', icon: <PointOfSaleIcon />, path: '/ecommerce-sales' },
        { text: 'Productos Comerciales', icon: <InventoryIcon />, path: '/commercial-products' },
        { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/suppliers' },
        { text: 'Órdenes de Compra', icon: <AssignmentIcon />, path: '/purchase-orders' },
        { text: 'Locales', icon: <StoreIcon />, path: '/locals' },
        { text: 'Usuarios', icon: <PeopleIcon />, path: '/users' },
        { text: 'Recursos Humanos', icon: <GroupIcon />, path: '/human-resources' },
        { text: 'Contable/Finanzas', icon: <MonetizationOnIcon />, path: '/accounting-finance' },
        { text: 'Informes', icon: <BarChartIcon />, path: '/reports' },
    ];

    return (
        <Drawer
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    marginTop: '56px', // Ajustado para la altura del Navbar
                    height: 'calc(100% - 56px)',
                    zIndex: (theme) => theme.zIndex.drawer,
                    transition: (theme) =>
                        theme.transitions.create('transform', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    transform: open ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
                },
            }}
            variant="persistent"
            open={open}
            anchor="left"
        >
            <List>
                {modules.map((module) => (
                    <ListItem key={module.text} disablePadding>
                        <ListItemButton component={Link} to={module.path}>
                            <ListItemIcon>
                                {module.icon}
                            </ListItemIcon>
                            <ListItemText primary={module.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;
