import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem,
    Select, InputLabel, FormControl
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Absence Form Dialog Component
const AbsenceForm = ({ open, onClose, onSave, absence }) => {
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
        if (absence) {
            setFormData({
                ...absence,
                absence_date: absence.absence_date ? new Date(absence.absence_date).toISOString().split('T')[0] : '',
                employee: absence.employee?.id || '',
            });
        } else {
            setFormData({
                employee: '',
                absence_date: new Date().toISOString().split('T')[0],
                reason: '',
            });
        }
    }, [absence, open]);

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
            <DialogTitle>{absence ? 'Editar Ausencia' : 'Nueva Ausencia'}</DialogTitle>
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

                <TextField margin="dense" name="absence_date" label="Fecha de Ausencia" type="date" fullWidth value={formData.absence_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="reason" label="Motivo" type="text" fullWidth value={formData.reason || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Absences Management Component
const AbsencesManagement = () => {
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAbsence, setSelectedAbsence] = useState(null);
    const { tenantId } = useAuth();

    const fetchAbsences = async () => {
        try {
            setLoading(true);
            const data = await api.list('/absences/'); // Assuming an /absences/ endpoint
            const absenceList = Array.isArray(data) ? data : data.results;
            setAbsences(absenceList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las ausencias. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchAbsences();
        }
    }, [tenantId]);

    const handleOpenForm = (absence = null) => {
        setSelectedAbsence(absence);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedAbsence(null);
        setIsFormOpen(false);
    };

    const handleSave = async (absenceData) => {
        try {
            const dataToSend = {
                ...absenceData,
                employee: absenceData.employee || null,
            };

            if (selectedAbsence) {
                await api.update('/absences/', selectedAbsence.id, dataToSend);
            } else {
                await api.create('/absences/', dataToSend);
            }
            fetchAbsences(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la ausencia.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta ausencia?')) {
            try {
                await api.remove('/absences/', id);
                fetchAbsences(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la ausencia.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Ausencias</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Ausencia
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Empleado</TableCell>
                                <TableCell>Fecha de Ausencia</TableCell>
                                <TableCell>Motivo</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {absences.map((absence) => (
                                <TableRow key={absence.id}>
                                    <TableCell>{absence.employee_name || absence.employee}</TableCell>
                                    <TableCell>{absence.absence_date}</TableCell>
                                    <TableCell>{absence.reason}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(absence)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(absence.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <AbsenceForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                absence={selectedAbsence} 
            />
        </Box>
    );
};

export default AbsencesManagement;
