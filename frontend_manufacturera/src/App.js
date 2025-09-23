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

// Import all module components
import ProcessManagement from './components/modules/ProcessManagement';
import OrderNoteManagement from './components/modules/OrderNoteManagement';
import ProductionOrderManagement from './components/modules/ProductionOrderManagement';
import MateriasPrimasModule from './components/modules/MateriasPrimasModule';
import CuttingOrderManagement from './components/modules/CuttingOrderManagement';
import ProductosModule from './components/modules/ProductosModule';
import ProductionProcessLogManagement from './components/modules/ProductionProcessLogManagement';
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
        <Navbar drawerWidth={drawerWidth} handleDrawerToggle={handleDrawerToggle} sidebarOpen={sidebarOpen} />
        <Sidebar open={sidebarOpen} drawerWidth={drawerWidth} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
            ml: { sm: `${sidebarOpen ? drawerWidth : 0}px` },
            transition: (theme) =>
                theme.transitions.create(['width', 'margin'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    ) : (
      <Navigate to="/login" />
    );
  };

  return (
    <div className="App">
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
          <Route path="/cutting-orders" element={<PrivateRoute><CuttingOrderManagement /></PrivateRoute>} />
          <Route path="/production-process-logs" element={<PrivateRoute><ProductionProcessLogManagement /></PrivateRoute>} />
          <Route path="/designs" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<PrivateRoute><ProductosModule /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><InventarioModule /></PrivateRoute>} />

          {/* Routes for common modules (financial, HR, quotations) */}
          <Route path="/ventas" element={<PrivateRoute><VentasModule /></PrivateRoute>} />
          <Route path="/contable-finanzas" element={<PrivateRoute><FinanzasModule /></PrivateRoute>} />
          <Route path="/factories" element={<PrivateRoute><FactoryManagement /></PrivateRoute>} />
          <Route path="/recursos-humanos" element={<PrivateRoute><RRHHModule /></PrivateRoute>} />
          <Route path="/presupuestos" element={<PrivateRoute><PresupuestoModule /></PrivateRoute>} />
          
          <Route path="/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><ClientesModule /></PrivateRoute>} />
          <Route path="/proveedores" element={<PrivateRoute><ProveedoresModule /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><ReportsModule /></PrivateRoute>} />
          <Route path="/test" element={<PrivateRoute><TestComponent /></PrivateRoute>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
