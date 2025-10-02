import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ManufacturingDashboard from './components/ManufacturingDashboard';

import LoginPage from './pages/LoginPage';
import { useAuth } from './context/AuthContext';
import ReportsModule from './components/reports/ReportsModule';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Box, CssBaseline, Toolbar, CircularProgress } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

// Import all module components
import ProcessManagement from './components/modules/ProcessManagement';
import OrderNoteManagement from './components/modules/OrderNoteManagement';
import ProductionOrderManagement from './components/modules/ProductionOrderManagement';
import MateriasPrimasModule from './components/modules/MateriasPrimasModule';
import ProductosModule from './components/modules/ProductosModule';
import FactoryManagement from './components/modules/FactoryManagement';
import PresupuestoModule from './components/modules/PresupuestoModule';
import UserManagement from './components/modules/UserManagement';
import ProveedoresModule from './components/modules/ProveedoresModule';
import VentasModule from './components/modules/VentasModule';
import FinanzasModule from './components/modules/FinanzasModule';
import RRHHModule from './components/modules/RRHHModule';
import InventarioModule from './components/modules/InventarioModule';
import RemitosModule from './components/modules/RemitosModule';
import TestComponent from './components/modules/TestComponent';
import ClientesModule from './components/modules/ClientesModule';
import ProductionTracking from './components/modules/ProductionTracking';
import AdministrationModule from './components/modules/AdministrationModule';

const drawerWidth = 240;

function App() {
  const { isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MainApp />
  );
}

// We extract the main application logic into a separate component
// so that we can use hooks that depend on the AuthContext.
function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? (
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Navbar handleDrawerToggle={handleDrawerToggle} />
        <Sidebar open={sidebarOpen} drawerWidth={drawerWidth} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: 3,
            pb: 3,
            pt: '60px', // CAMBIO: 48px navbar + 4px mínimo
            width: '100%',
            transition: (theme) =>
                theme.transitions.create(['margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            marginLeft: { sm: sidebarOpen ? `${drawerWidth}px` : 0 },
          }}
        >
          {children}
        </Box>
      </Box>
    ) : (
      <Navigate to="/login" />
    );
};

  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Navigate to="/ordenes-de-produccion" replace />
                </PrivateRoute>
              }
            />
            <Route
              path="/manufacturing-dashboard"
              element={
                <PrivateRoute>
                  <ManufacturingDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Routes for manufacturing-specific modules */}
            <Route path="/remitos" element={<PrivateRoute><RemitosModule /></PrivateRoute>} />
            <Route path="/processes" element={<PrivateRoute><ProcessManagement /></PrivateRoute>} />
            <Route path="/notas-de-pedido" element={<PrivateRoute><OrderNoteManagement /></PrivateRoute>} />
            <Route path="/ordenes-de-produccion" element={<PrivateRoute><ProductionOrderManagement /></PrivateRoute>} />
            <Route path="/materias-primas" element={<PrivateRoute><MateriasPrimasModule /></PrivateRoute>} />
            <Route path="/seguimiento-produccion" element={<PrivateRoute><ProductionTracking /></PrivateRoute>} />
            <Route path="/designs" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<PrivateRoute><ProductosModule /></PrivateRoute>} />
            <Route path="/inventory" element={<PrivateRoute><InventarioModule /></PrivateRoute>} />

            {/* Routes for common modules (financial, HR, quotations) */}
            <Route path="/ventas" element={<PrivateRoute><VentasModule /></PrivateRoute>} />
            <Route path="/contable-finanzas" element={<PrivateRoute><FinanzasModule /></PrivateRoute>} />
            <Route path="/recursos-humanos" element={<PrivateRoute><RRHHModule /></PrivateRoute>} />
            <Route path="/presupuestos" element={<PrivateRoute><PresupuestoModule /></PrivateRoute>} />
            <Route path="/administracion" element={<PrivateRoute><AdministrationModule /></PrivateRoute>} />
            
            <Route path="/clientes" element={<PrivateRoute><ClientesModule /></PrivateRoute>} />
            <Route path="/proveedores" element={<PrivateRoute><ProveedoresModule /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><ReportsModule /></PrivateRoute>} />
            <Route path="/test" element={<PrivateRoute><TestComponent /></PrivateRoute>} />
          </Routes>
        </Router>
      </ThemeProvider>
    </div>
  );
}

export default App;
