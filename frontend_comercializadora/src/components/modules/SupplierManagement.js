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

// Supplier Form Dialog Component
const SupplierForm = ({ open, onClose, onSave, supplier }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (supplier) {
            setFormData(supplier);
        } else {
            setFormData({
                name: '',
                contact_info: '',
                cuit_cuil: ''
            });
        }
    }, [supplier, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="contact_info" label="Información de Contacto" type="text" fullWidth value={formData.contact_info || ''} onChange={handleChange} />
                <TextField margin="dense" name="cuit_cuil" label="CUIT/CUIL" type="text" fullWidth value={formData.cuit_cuil || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Supplier Management Component
const SupplierManagement = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const { tenantId } = useAuth();

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await api.list('/suppliers/');
            const supplierList = Array.isArray(data) ? data : data.results;
            setSuppliers(supplierList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los proveedores. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchSuppliers();
        }
    }, [tenantId]);

    const handleOpenForm = (supplier = null) => {
        setSelectedSupplier(supplier);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedSupplier(null);
        setIsFormOpen(false);
    };

    const handleSave = async (supplierData) => {
        try {
            if (selectedSupplier) {
                await api.update('/suppliers/', selectedSupplier.id, supplierData);
            } else {
                await api.create('/suppliers/', supplierData);
            }
            fetchSuppliers(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el proveedor.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
            try {
                await api.remove('/suppliers/', id);
                fetchSuppliers(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el proveedor.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Proveedores</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Proveedor
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Información de Contacto</TableCell>
                                <TableCell>CUIT/CUIL</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell>{supplier.name}</TableCell>
                                    <TableCell>{supplier.contact_info}</TableCell>
                                    <TableCell>{supplier.cuit_cuil}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(supplier)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(supplier.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <SupplierForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                supplier={selectedSupplier} 
            />
        </Box>
    );
};

export default SupplierManagement;
