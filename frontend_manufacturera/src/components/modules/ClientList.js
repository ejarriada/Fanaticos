import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Client Form Dialog Component
const ClientForm = ({ open, onClose, onSave, client }) => {
    const [formData, setFormData] = useState({
        name: '',
        cuit: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        iva_condition: '',
        details: '',
        contacts: []
    });

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                cuit: client.cuit || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                city: client.city || '',
                province: client.province || '',
                iva_condition: client.iva_condition || '',
                details: client.details || '',
                contacts: client.contacts || []
            });
        } else {
            setFormData({
                name: '',
                cuit: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                province: '',
                iva_condition: '',
                details: '',
                contacts: []
            });
        }
    }, [client, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleContactChange = (index, e) => {
        const newContacts = [...formData.contacts];
        newContacts[index][e.target.name] = e.target.value;
        setFormData({ ...formData, contacts: newContacts });
    };

    const addContact = () => {
        setFormData({ ...formData, contacts: [...formData.contacts, { name: '', phone: '', email: '', position: '' }] });
    };

    const removeContact = (index) => {
        const newContacts = [...formData.contacts];
        newContacts.splice(index, 1);
        setFormData({ ...formData, contacts: newContacts });
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
                <TextField margin="dense" name="city" label="Ciudad" type="text" fullWidth value={formData.city || ''} onChange={handleChange} />
                <TextField margin="dense" name="province" label="Provincia" type="text" fullWidth value={formData.province || ''} onChange={handleChange} />
                <TextField margin="dense" name="iva_condition" label="Condición IVA" type="text" fullWidth value={formData.iva_condition || ''} onChange={handleChange} />
                <TextField margin="dense" name="details" label="Detalles" type="text" fullWidth multiline rows={3} value={formData.details || ''} onChange={handleChange} />

                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Contactos</Typography>
                {formData.contacts.map((contact, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
                        <TextField margin="dense" name="name" label="Nombre Contacto" type="text" fullWidth value={contact.name || ''} onChange={(e) => handleContactChange(index, e)} />
                        <TextField margin="dense" name="phone" label="Teléfono Contacto" type="text" fullWidth value={contact.phone || ''} onChange={(e) => handleContactChange(index, e)} />
                        <TextField margin="dense" name="email" label="Email Contacto" type="email" fullWidth value={contact.email || ''} onChange={(e) => handleContactChange(index, e)} />
                        <TextField margin="dense" name="position" label="Cargo Contacto" type="text" fullWidth value={contact.position || ''} onChange={(e) => handleContactChange(index, e)} />
                        <Button onClick={() => removeContact(index)} color="error" sx={{ mt: 1 }}>Eliminar Contacto</Button>
                    </Box>
                ))}
                <Button onClick={addContact} startIcon={<AddIcon />} sx={{ mt: 1 }}>Agregar Contacto</Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Client Management Component
const ClientList = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const { tenantId, authToken } = useAuth();

    const fetchClients = async () => {
        try {
            setLoading(true);
            const data = await api.list('/clients/');
            console.log('Data from API:', data);
            const clientList = Array.isArray(data) ? data : data.results;
            console.log('ClientList after processing:', clientList);

            const clientsWithBalance = await Promise.all(clientList.map(async (client) => {
                try {
                    const balanceData = await api.get(`/clients/`, `${client.id}/current-account-balance`);
                    return { ...client, current_account_balance: balanceData.balance };
                } catch (balanceErr) {
                    console.error(`Error fetching balance for client ${client.id}:`, balanceErr);
                    return { ...client, current_account_balance: 'Error' };
                }
            }));

            console.log('Clients with balance:', clientsWithBalance);
            setClients(clientsWithBalance || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los clientes. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId && authToken?.access) {
            fetchClients();
        }
    }, [tenantId, authToken]);

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
                await api.update('/clients/', selectedClient.id, clientData); // Removed tenantId
            } else {
                await api.create('/clients/', clientData); // Removed tenantId
            }
            fetchClients(); // Refresh list
            handleCloseForm();
        } catch (err) {
            console.log("Detailed error response:", err.response?.data);
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
                await api.remove('/clients/', id); // Removed tenantId
                fetchClients(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el cliente.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
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
                                <TableCell>Teléfono</TableCell>
                                <TableCell>Ciudad</TableCell>
                                <TableCell>Cuenta Corriente</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>{client.city}</TableCell>
                                    <TableCell>{client.current_account_balance !== undefined ? `${client.current_account_balance.toFixed(2)}` : 'Cargando...'}</TableCell>
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

export default ClientList;