import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// MedicalRecord Form Dialog Component
const MedicalRecordForm = ({ open, onClose, onSave, medicalRecord }) => {
    const [formData, setFormData] = useState({});
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [employeesError, setEmployeesError] = useState(null);
    const { tenantId } = useAuth();
    const fileInputRef = useRef(null);

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
        if (medicalRecord) {
            setFormData({
                ...medicalRecord,
                record_date: medicalRecord.record_date ? new Date(medicalRecord.record_date).toISOString().split('T')[0] : '',
                employee: medicalRecord.employee?.id || '',
            });
        } else {
            setFormData({
                employee: '',
                record_date: new Date().toISOString().split('T')[0],
                description: '',
                file: null
            });
        }
    }, [medicalRecord, open]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file') {
            setFormData({ ...formData, file: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = () => {
        const dataToSave = new FormData();
        dataToSave.append('employee', formData.employee);
        dataToSave.append('record_date', formData.record_date);
        dataToSave.append('description', formData.description);
        if (formData.file) {
            dataToSave.append('file', formData.file);
        }

        onSave(dataToSave, medicalRecord ? medicalRecord.id : null);
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
            <DialogTitle>{medicalRecord ? 'Editar Historial Médico' : 'Nuevo Historial Médico'}</DialogTitle>
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

                <TextField margin="dense" name="record_date" label="Fecha de Registro" type="date" fullWidth value={formData.record_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth value={formData.description || ''} onChange={handleChange} />
                
                <Button
                    variant="contained"
                    component="label"
                    sx={{ mt: 2 }}
                >
                    {medicalRecord && medicalRecord.file ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
                    <input type="file" name="file" hidden onChange={handleChange} ref={fileInputRef} />
                </Button>
                {formData.file && typeof formData.file === 'object' && formData.file.name && (
                    <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                        {formData.file.name}
                    </Typography>
                )}
                {medicalRecord && medicalRecord.file && typeof formData.file === 'string' && (
                    <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                        Archivo actual: <a href={medicalRecord.file} target="_blank" rel="noopener noreferrer">
                            <IconButton><DownloadIcon /></IconButton>
                            {medicalRecord.file.split('/').pop()}
                        </a>
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main MedicalRecord Management Component
const MedicalRecordManagement = () => {
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
    const { tenantId } = useAuth();

    const fetchMedicalRecords = async () => {
        try {
            setLoading(true);
            const data = await api.list('/medical-records/');
            const medicalRecordList = Array.isArray(data) ? data : data.results;
            setMedicalRecords(medicalRecordList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los registros médicos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchMedicalRecords();
        }
    }, [tenantId]);

    const handleOpenForm = (medicalRecord = null) => {
        setSelectedMedicalRecord(medicalRecord);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedMedicalRecord(null);
        setIsFormOpen(false);
    };

    const handleSave = async (formData, id = null) => {
        try {
            const config = {};
            if (formData instanceof FormData) {
                // Axios automatically sets Content-Type to multipart/form-data for FormData
            }

            if (id) {
                await api.update('/medical-records/', id, formData, config);
            } else {
                await api.create('/medical-records/', formData, config);
            }
            fetchMedicalRecords(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el registro médico.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este registro médico?')) {
            try {
                await api.remove('/medical-records/', id);
                fetchMedicalRecords(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el registro médico.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Registro Médico
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Empleado</TableCell>
                                <TableCell>Fecha de Registro</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Archivo</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {medicalRecords.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{record.employee_name || record.employee}</TableCell>
                                    <TableCell>{record.record_date}</TableCell>
                                    <TableCell>{record.description}</TableCell>
                                    <TableCell>
                                        {record.file ? (
                                            <a href={record.file} target="_blank" rel="noopener noreferrer">
                                                <IconButton><DownloadIcon /></IconButton>
                                                {record.file.split('/').pop()}
                                            </a>
                                        ) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(record)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(record.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <MedicalRecordForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                medicalRecord={selectedMedicalRecord} 
            />
        </Box>
    );
};

export default MedicalRecordManagement;
