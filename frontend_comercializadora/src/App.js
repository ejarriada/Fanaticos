import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ManagementDashboard from './components/ManagementDashboard';
import TradingDashboard from './components/TradingDashboard';
import LoginPage from './pages/LoginPage';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Box, CssBaseline, Toolbar } from '@mui/material';

// Import all placeholder module components
import LocalManagement from './components/modules/LocalManagement';
import SaleManagement from './components/modules/SaleManagement';
import InventoryManagement from './components/modules/InventoryManagement';
import HumanResourcesModule from './components/modules/HumanResourcesModule';
import AccountingFinanceModule from './components/modules/AccountingFinanceModule';
import SupplierManagement from './components/modules/SupplierManagement';
import PurchaseOrderManagement from './components/modules/PurchaseOrderManagement';
import AccountManagement from './components/modules/AccountManagement';
import CashRegisterManagement from './components/modules/CashRegisterManagement';
import TransactionManagement from './components/modules/TransactionManagement';
import ClientManagement from './components/modules/ClientManagement';
import InvoiceManagement from './components/modules/InvoiceManagement';
import PaymentManagement from './components/modules/PaymentManagement';
import BankStatementManagement from './components/modules/BankStatementManagement';
import BankManagement from './components/modules/BankManagement';
import PaymentMethodTypeManagement from './components/modules/PaymentMethodTypeManagement';
import FinancialCostRuleManagement from './components/modules/FinancialCostRuleManagement';
import EmployeeRoleManagement from './components/modules/EmployeeRoleManagement';
import EmployeeManagement from './components/modules/EmployeeManagement';
import SalaryManagement from './components/modules/SalaryManagement';
import VacationManagement from './components/modules/VacationManagement';
import PermitManagement from './components/modules/PermitManagement';
import MedicalRecordManagement from './components/modules/MedicalRecordManagement';
import UserManagement from './components/modules/UserManagement';
import ReportsModule from './components/reports/ReportsModule';


import DeliveryNoteManagement from './components/modules/DeliveryNoteManagement';

const drawerWidth = 240;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // PrivateRoute component to protect routes
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
                <ManagementDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/management-dashboard"
            element={
              <PrivateRoute>
                <ManagementDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/trading-dashboard"
            element={
              <PrivateRoute>
                <TradingDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <ReportsModule />
              </PrivateRoute>
            }
          />
          {/* Routes for other modules */}
          <Route path="/locals" element={<PrivateRoute><LocalManagement /></PrivateRoute>} />
          <Route path="/sales" element={<PrivateRoute><SaleManagement /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><InventoryManagement /></PrivateRoute>} />
          <Route path="/suppliers" element={<PrivateRoute><SupplierManagement /></PrivateRoute>} />
          <Route path="/purchase-orders" element={<PrivateRoute><PurchaseOrderManagement /></PrivateRoute>} />
          <Route path="/accounting-finance" element={<PrivateRoute><AccountingFinanceModule /></PrivateRoute>} />
          <Route path="/human-resources" element={<PrivateRoute><HumanResourcesModule /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />

          

          
        </Routes>
      </Router>
    </div>
  );
}

export default App;
