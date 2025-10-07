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

// Client Form Dialog Component
const ClientForm = ({ open, onClose, onSave, client }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (client) {
            setFormData(client);
        } else {
            setFormData({
                name: '',
                cuit: '',
                email: '',
                phone: '',
                address: ''
            });
        }
    }, [client, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{client ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="cuit" label="CUIT" type="text" fullWidth value={formData.cuit || ''} onChange={handleChange} />
                <TextField margin="dense" name="email" label="Email" type="email" fullWidth value={formData.email || ''} onChange={handleChange} />
                <TextField margin="dense" name="phone" label="Teléfono" type="text" fullWidth value={formData.phone || ''} onChange={handleChange} />
                <TextField margin="dense" name="address" label="Dirección" type="text" fullWidth value={formData.address || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Client Management Component
const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const { tenantId } = useAuth();

    const fetchClients = async () => {
        try {
            setLoading(true);
            const data = await api.list('/clients/', tenantId);
            const clientList = Array.isArray(data) ? data : data.results;
            setClients(clientList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los clientes. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchClients();
        }
    }, [tenantId]);

    const handleOpenForm = (client = null) => {
        setSelectedClient(client);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedClient(null);
        setIsFormOpen(false);
    };

    const handleSave = async (clientData) => {
        try {
            if (selectedClient) {
                await api.update('/clients/', selectedClient.id, clientData, tenantId);
            } else {
                await api.create('/clients/', clientData, tenantId);
            }
            fetchClients(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el cliente.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este cliente?')) {
            try {
                await api.remove('/clients/', id, tenantId);
                fetchClients(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el cliente.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Clientes</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Cliente
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>CUIT</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Teléfono</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>{client.cuit}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(client)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(client.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ClientForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                client={selectedClient} 
            />
        </Box>
    );
};

export default ClientManagement;
