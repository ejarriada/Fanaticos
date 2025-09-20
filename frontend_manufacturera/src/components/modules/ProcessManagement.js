import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, FormControlLabel, Checkbox 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Process Form Dialog Component
const ProcessForm = ({ open, onClose, onSave, process }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (process) {
            setFormData(process);
        } else {
            setFormData({
                name: '',
                description: '',
                is_initial_process: false,
                applies_to_medias: false,
                applies_to_indumentaria: false
            });
        }
    }, [process, open]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{process ? 'Editar Proceso' : 'Nuevo Proceso'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth value={formData.description || ''} onChange={handleChange} />
                <FormControlLabel
                    control={<Checkbox checked={formData.is_initial_process || false} onChange={handleChange} name="is_initial_process" />}
                    label="Es Proceso Inicial"
                />
                <FormControlLabel
                    control={<Checkbox checked={formData.applies_to_medias || false} onChange={handleChange} name="applies_to_medias" />}
                    label="Aplica a Medias"
                />
                <FormControlLabel
                    control={<Checkbox checked={formData.applies_to_indumentaria || false} onChange={handleChange} name="applies_to_indumentaria" />}
                    label="Aplica a Indumentaria"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Process Management Component
const ProcessManagement = () => {
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState(null);
    const { tenantId } = useAuth();

    const fetchProcesses = async () => {
        try {
            setLoading(true);
            const data = await api.list('/processes/');
            const processList = Array.isArray(data) ? data : data.results;
            setProcesses(processList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los procesos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchProcesses();
        }
    }, [tenantId]);

    const handleOpenForm = (process = null) => {
        setSelectedProcess(process);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedProcess(null);
        setIsFormOpen(false);
    };

    const handleSave = async (processData) => {
        try {
            if (selectedProcess) {
                await api.update('/processes/', selectedProcess.id, processData);
            } else {
                await api.create('/processes/', processData);
            }
            fetchProcesses(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el proceso.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este proceso?')) {
            try {
                await api.remove('/processes/', id);
                fetchProcesses(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el proceso.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Procesos</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Proceso
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
                                <TableCell>Es Proceso Inicial</TableCell>
                                <TableCell>Aplica a Medias</TableCell>
                                <TableCell>Aplica a Indumentaria</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {processes.map((process) => (
                                <TableRow key={process.id}>
                                    <TableCell>{process.name}</TableCell>
                                    <TableCell>{process.description}</TableCell>
                                    <TableCell>{process.is_initial_process ? 'Sí' : 'No'}</TableCell>
                                    <TableCell>{process.applies_to_medias ? 'Sí' : 'No'}</TableCell>
                                    <TableCell>{process.applies_to_indumentaria ? 'Sí' : 'No'}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(process)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(process.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ProcessForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                process={selectedProcess} 
            />
        </Box>
    );
};

export default ProcessManagement;
