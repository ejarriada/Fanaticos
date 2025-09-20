import React from 'react';
import { Link } from 'react-router-dom';
import {
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Box, Typography
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category'; // Icon for Products
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RuleIcon from '@mui/icons-material/Rule';
import WorkIcon from '@mui/icons-material/Work';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import PaidIcon from '@mui/icons-material/Paid';
import CommuteIcon from '@mui/icons-material/Commute';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupIcon from '@mui/icons-material/Group'; // Icon for HR
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // Icon for Accounting/Finance

const Sidebar = ({ open, drawerWidth }) => {
    const modules = [
        { text: 'Ventas', icon: <PointOfSaleIcon />, path: '/sales' },
        
        { text: 'Remitos', icon: <LocalShippingIcon />, path: '/delivery-notes' },
        { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory' },
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
            <Toolbar />
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