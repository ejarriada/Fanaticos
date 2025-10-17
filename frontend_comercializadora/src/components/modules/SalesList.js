
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, IconButton, CircularProgress, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SalesList = ({ sales, onEdit, onDelete }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleFilter = () => {
        // This filter logic will need to be passed up to the parent component
        // or re-evaluated if filtering is done client-side.
        console.log('Filtering sales from', startDate, 'to', endDate);
    };

    return (
        <div>
            <h2>Listado de Ventas</h2>
            <div style={{ marginBottom: '20px' }}>
                <TextField
                    label="Fecha de Inicio"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <TextField
                    label="Fecha de Fin"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    style={{ marginLeft: '10px' }}
                />
                <Button variant="contained" color="primary" onClick={handleFilter} style={{ marginLeft: '10px' }}>
                    Filtrar
                </Button>
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Fecha de Creación</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell>{sale.id}</TableCell>
                                <TableCell>{sale.client}</TableCell>
                                <TableCell>{sale.user}</TableCell>
                                <TableCell>{sale.status}</TableCell>
                                <TableCell>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => onEdit(sale)}><EditIcon /></IconButton>
                                    <IconButton onClick={() => onDelete(sale.id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default SalesList;
