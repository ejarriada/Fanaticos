import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

import CommercialEmployeeForm from './CommercialEmployeeForm';

// Main Employee Management Component
const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const { tenantId } = useAuth();

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await api.list('commercial/commercial-employees/');
            const employeeList = Array.isArray(data) ? data : data.results;
            setEmployees(employeeList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los empleados. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchEmployees();
        }
    }, [tenantId]);

    const handleOpenForm = (employee = null) => {
        setSelectedEmployee(employee);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedEmployee(null);
        setIsFormOpen(false);
    };

    const handleSave = async (employeeData) => {
        try {
            const dataToSend = {
                ...employeeData,
                user: employeeData.user || null,
                local: employeeData.local || null, // Changed from factory
                role: employeeData.role || null,
            };

            if (selectedEmployee) {
                await api.update('commercial/commercial-employees/', selectedEmployee.id, dataToSend);
            } else {
                await api.create('commercial/commercial-employees/', dataToSend);
            }
            fetchEmployees(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el empleado.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este empleado?')) {
            try {
                await api.remove('commercial/commercial-employees/', id);
                fetchEmployees(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el empleado.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Empleados Comerciales</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Empleado Comercial
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Local</TableCell>
                                <TableCell>Rol</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>{employee.user}</TableCell>
                                    <TableCell>{employee.local}</TableCell>
                                    <TableCell>{employee.role}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(employee)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(employee.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <CommercialEmployeeForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                employee={selectedEmployee} 
            />
        </Box>
    );
};

export default EmployeeManagement;
