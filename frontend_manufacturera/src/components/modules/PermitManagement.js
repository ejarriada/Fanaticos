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

// Permit Form Dialog Component
const PermitForm = ({ open, onClose, onSave, permit }) => {
    const [formData, setFormData] = useState({});
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [employeesError, setEmployeesError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoadingEmployees(true);
                const data = await api.list('/employees/');
                const employeeList = Array.isArray(data) ? data : data.results;
                setEmployees(employeeList || []);
            } catch (err) {
                setEmployeesError('Error al cargar los empleados.');
                console.error(err);
            } finally {
                setLoadingEmployees(false);
            }
        };

        if (tenantId) {
            fetchEmployees();
        }
    }, [tenantId]);

    useEffect(() => {
        if (permit) {
            setFormData({
                ...permit,
                start_date: permit.start_date ? new Date(permit.start_date).toISOString().split('T')[0] : '',
                end_date: permit.end_date ? new Date(permit.end_date).toISOString().split('T')[0] : '',
                employee: permit.employee?.id || '',
            });
        } else {
            setFormData({
                employee: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                reason: ''
            });
        }
    }, [permit, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingEmployees) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (employeesError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">{employeesError}</Alert></DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{permit ? 'Editar Permiso' : 'Nuevo Permiso'}</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    name="employee"
                    label="Empleado"
                    select
                    fullWidth
                    value={formData.employee || ''}
                    onChange={handleChange}
                >
                    {employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                            {`${employee.first_name} ${employee.last_name}`}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="start_date" label="Fecha de Inicio" type="date" fullWidth value={formData.start_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="end_date" label="Fecha de Fin" type="date" fullWidth value={formData.end_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="reason" label="Razón" type="text" fullWidth value={formData.reason || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Permit Management Component
const PermitManagement = () => {
    const [permits, setPermits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPermit, setSelectedPermit] = useState(null);
    const { tenantId } = useAuth();

    const fetchPermits = async () => {
        try {
            setLoading(true);
            const data = await api.list('/permits/');
            const permitList = Array.isArray(data) ? data : data.results;
            setPermits(permitList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los permisos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchPermits();
        }
    }, [tenantId]);

    const handleOpenForm = (permit = null) => {
        setSelectedPermit(permit);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedPermit(null);
        setIsFormOpen(false);
    };

    const handleSave = async (permitData) => {
        try {
            const dataToSend = {
                ...permitData,
                employee: permitData.employee || null,
            };

            if (selectedPermit) {
                await api.update('/permits/', selectedPermit.id, dataToSend);
            } else {
                await api.create('/permits/', dataToSend);
            }
            fetchPermits(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el permiso.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este permiso?')) {
            try {
                await api.remove('/permits/', id);
                fetchPermits(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el permiso.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Permisos</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Permiso
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Empleado</TableCell>
                                <TableCell>Fecha de Inicio</TableCell>
                                <TableCell>Fecha de Fin</TableCell>
                                <TableCell>Razón</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {permits.map((permit) => (
                                <TableRow key={permit.id}>
                                    <TableCell>{permit.employee_name || permit.employee}</TableCell>
                                    <TableCell>{permit.start_date}</TableCell>
                                    <TableCell>{permit.end_date}</TableCell>
                                    <TableCell>{permit.reason}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(permit)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(permit.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <PermitForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                permit={selectedPermit} 
            />
        </Box>
    );
};

export default PermitManagement;
