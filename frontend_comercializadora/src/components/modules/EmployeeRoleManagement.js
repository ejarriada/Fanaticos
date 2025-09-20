import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// EmployeeRole Form Dialog Component
const EmployeeRoleForm = ({ open, onClose, onSave, employeeRole }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (employeeRole) {
            setFormData(employeeRole);
        } else {
            setFormData({
                name: '',
                description: ''
            });
        }
    }, [employeeRole, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{employeeRole ? 'Editar Rol de Empleado' : 'Nuevo Rol de Empleado'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth value={formData.description || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main EmployeeRole Management Component
const EmployeeRoleManagement = () => {
    const [employeeRoles, setEmployeeRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployeeRole, setSelectedEmployeeRole] = useState(null);
    const { tenantId } = useAuth();

    const fetchEmployeeRoles = async () => {
        try {
            setLoading(true);
            const data = await api.list('/employee-roles/');
            const employeeRoleList = Array.isArray(data) ? data : data.results;
            setEmployeeRoles(employeeRoleList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los roles de empleado. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchEmployeeRoles();
        }
    }, [tenantId]);

    const handleOpenForm = (employeeRole = null) => {
        setSelectedEmployeeRole(employeeRole);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedEmployeeRole(null);
        setIsFormOpen(false);
    };

    const handleSave = async (employeeRoleData) => {
        try {
            if (selectedEmployeeRole) {
                await api.update('/employee-roles/', selectedEmployeeRole.id, employeeRoleData);
            } else {
                await api.create('/employee-roles/', employeeRoleData);
            }
            fetchEmployeeRoles(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el rol de empleado.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este rol de empleado?')) {
            try {
                await api.remove('/employee-roles/', id);
                fetchEmployeeRoles(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el rol de empleado.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Roles de Empleado</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Rol de Empleado
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employeeRoles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>{role.name}</TableCell>
                                    <TableCell>{role.description}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(role)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(role.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <EmployeeRoleForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                employeeRole={selectedEmployeeRole} 
            />
        </Box>
    );
};

export default EmployeeRoleManagement;
