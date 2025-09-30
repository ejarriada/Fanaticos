import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';

const FormDialog = ({ open, onClose, onSave, item, title, fields }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        setFormData(item || {});
    }, [item, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{item ? `Editar ${title}` : `Nuevo ${title}`}</DialogTitle>
            <DialogContent>
                {fields.map(field => (
                    <TextField key={field.name} margin="dense" name={field.name} label={field.label} type={field.type || 'text'} fullWidth value={formData[field.name] || ''} onChange={handleChange} />
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={() => onSave(formData)}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

const SizeModule = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const apiEndpoint = '/sizes/';
    const title = 'Talle';
    const fields = [{ name: 'name', label: 'Nombre' }];
    const columns = [{ key: 'name', label: 'Nombre' }];

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await api.list(apiEndpoint);
            setItems(Array.isArray(data) ? data : data.results || []);
        } catch (err) { setError(`Error al cargar ${title}s.`); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (itemData) => {
        try {
            if (selectedItem) {
                await api.update(apiEndpoint, selectedItem.id, itemData);
            } else {
                await api.create(apiEndpoint, itemData);
            }
            fetchData();
            setIsFormOpen(false);
            setSelectedItem(null);
        } catch (err) { setError(`Error al guardar el ${title}.`); }
    };

    const handleDelete = async (id) => {
        if (window.confirm(`¿Está seguro de que desea eliminar este ${title}?`)) {
            try {
                await api.remove(apiEndpoint, id);
                fetchData();
            } catch (err) { setError(`Error al eliminar el ${title}.`); }
        }
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>{`Gestión de ${title}s`}</Typography>
            <Button variant="contained" onClick={() => { setSelectedItem(null); setIsFormOpen(true); }} sx={{ mb: 2 }}>{`Nuevo ${title}`}</Button>
            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {columns.map(col => <TableCell key={col.key}>{col.label}</TableCell>)}
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    {columns.map(col => <TableCell key={col.key}>{item[col.key]}</TableCell>)}
                                    <TableCell>
                                        <IconButton onClick={() => { setSelectedItem(item); setIsFormOpen(true); }}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <FormDialog open={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSave} item={selectedItem} title={title} fields={fields} />
        </Box>
    );
};

export default SizeModule;
