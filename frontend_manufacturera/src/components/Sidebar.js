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
import SettingsIcon from '@mui/icons-material/Settings';
import FactoryIcon from '@mui/icons-material/Factory';
import DescriptionIcon from '@mui/icons-material/Description';
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits';
import ScienceIcon from '@mui/icons-material/Science';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupIcon from '@mui/icons-material/Group'; // Icon for HR
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // Icon for Accounting/Finance
import TimelineIcon from '@mui/icons-material/Timeline'; // Icon for Tracking

const Sidebar = ({ open, drawerWidth }) => {
    const modules = [
        { text: 'Presupuestos', icon: <DescriptionIcon />, path: '/presupuestos' },
        { text: 'Ventas', icon: <PointOfSaleIcon />, path: '/ventas' },
        { text: 'Gestión de Clientes', icon: <PeopleIcon />, path: '/clientes' },
        { text: 'Notas de Pedido', icon: <DescriptionIcon />, path: '/notas-de-pedido' },
        { text: 'Órdenes de Producción', icon: <ProductionQuantityLimitsIcon />, path: '/ordenes-de-produccion' },
        { text: 'Seguimiento de Producción', icon: <TimelineIcon />, path: '/seguimiento-produccion' },
        { text: 'Remitos', icon: <ReceiptIcon />, path: '/remitos' },
        { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory' },
        { text: 'Procesos', icon: <SettingsIcon />, path: '/processes' },
        { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/proveedores' },
        { text: 'Materia Prima', icon: <ScienceIcon />, path: '/materias-primas' },
        { text: 'Gestión de Productos', icon: <ProductionQuantityLimitsIcon />, path: '/products' },
        { text: 'Administración', icon: <SettingsIcon />, path: '/administracion' },
        { text: 'Recursos Humanos', icon: <GroupIcon />, path: '/recursos-humanos' },
        { text: 'Contable/Finanzas', icon: <MonetizationOnIcon />, path: '/contable-finanzas' },
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
                    marginTop: '48px',
                    height: 'calc(100% - 48px)',
                    zIndex: (theme) => theme.zIndex.drawer, // CAMBIO: zIndex normal
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
