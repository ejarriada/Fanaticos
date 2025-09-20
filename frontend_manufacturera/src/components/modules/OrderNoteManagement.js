import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, CircularProgress, Alert 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import OrderNoteForm from './OrderNoteForm'; // Import the form

const OrderNoteManagement = () => {
    const [orderNotes, setOrderNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);

    const fetchOrderNotes = async () => {
        try {
            setLoading(true);
            const data = await api.list('/order-notes/');
            setOrderNotes(Array.isArray(data) ? data : data.results || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las notas de pedido.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderNotes();
    }, []);

    const handleOpenForm = (note = null) => {
        setSelectedNote(note);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedNote(null);
        setIsFormOpen(false);
    };

    const handleSave = async (formData) => {
        try {
            if (selectedNote) {
                await api.update('/order-notes/', selectedNote.id, formData);
            } else {
                await api.create('/order-notes/', formData);
            }
            fetchOrderNotes();
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            console.error('Backend Error Data:', errorData); // Log the actual error data
            const errorMsg = errorData ? JSON.stringify(errorData) : 'Error al guardar la nota de pedido.';
            setError(errorMsg);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta nota de pedido?')) {
            try {
                await api.remove('/order-notes/', id);
                fetchOrderNotes();
            } catch (err) {
                setError('Error al eliminar la nota de pedido.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Gestión de Notas de Pedido</Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={() => handleOpenForm()}>
                Nueva Nota de Pedido
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID de Pedido</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Vendedor</TableCell>
                                <TableCell>Fecha de Entrega</TableCell>
                                <TableCell>Monto Total</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orderNotes.map((note) => (
                                <TableRow key={note.id}>
                                    <TableCell>{note.id}</TableCell>
                                    <TableCell>{note.sale?.client?.name || 'Cliente no encontrado'}</TableCell>
                                    <TableCell>{note.sale?.user?.first_name || 'N/A'}</TableCell>
                                    <TableCell>{new Date(note.estimated_delivery_date).toLocaleDateString()}</TableCell>
                                    <TableCell>${note.sale?.total_amount}</TableCell>
                                    <TableCell>{note.status}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(note)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(note.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <OrderNoteForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                orderNote={selectedNote} 
            />
        </Box>
    );
};

export default OrderNoteManagement;