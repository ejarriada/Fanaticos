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

// Vacation Form Dialog Component
const VacationForm = ({ open, onClose, onSave, vacation }) => {
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
        if (vacation) {
            setFormData({
                ...vacation,
                start_date: vacation.start_date ? new Date(vacation.start_date).toISOString().split('T')[0] : '',
                end_date: vacation.end_date ? new Date(vacation.end_date).toISOString().split('T')[0] : '',
                employee: vacation.employee?.id || '',
            });
        } else {
            setFormData({
                employee: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
            });
        }
    }, [vacation, open]);

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
            <DialogTitle>{vacation ? 'Editar Vacaciones' : 'Nueva Vacación'}</DialogTitle>
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
                            {employee.user_email || employee.user}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="start_date" label="Fecha de Inicio" type="date" fullWidth value={formData.start_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="end_date" label="Fecha de Fin" type="date" fullWidth value={formData.end_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Vacation Management Component
const VacationManagement = () => {
    const [vacations, setVacations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedVacation, setSelectedVacation] = useState(null);
    const { tenantId } = useAuth();

    const fetchVacations = async () => {
        try {
            setLoading(true);
            const data = await api.list('/vacations/');
            const vacationList = Array.isArray(data) ? data : data.results;
            setVacations(vacationList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las vacaciones. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchVacations();
        }
    }, [tenantId]);

    const handleOpenForm = (vacation = null) => {
        setSelectedVacation(vacation);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedVacation(null);
        setIsFormOpen(false);
    };

    const handleSave = async (vacationData) => {
        try {
            const dataToSend = {
                ...vacationData,
                employee: vacationData.employee || null,
            };

            if (selectedVacation) {
                await api.update('/vacations/', selectedVacation.id, dataToSend);
            } else {
                await api.create('/vacations/', dataToSend);
            }
            fetchVacations(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar las vacaciones.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar estas vacaciones?')) {
            try {
                await api.remove('/vacations/', id);
                fetchVacations(); // Refresh list
            } catch (err) {
                setError('Error al eliminar las vacaciones.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Vacaciones</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Vacación
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
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vacations.map((vacation) => (
                                <TableRow key={vacation.id}>
                                    <TableCell>{vacation.employee_name || vacation.employee}</TableCell>
                                    <TableCell>{vacation.start_date}</TableCell>
                                    <TableCell>{vacation.end_date}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(vacation)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(vacation.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <VacationForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                vacation={selectedVacation} 
            />
        </Box>
    );
};

export default VacationManagement;
