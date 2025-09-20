import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { listRemitos } from '../../utils/api';

const VerRemitosList = () => {
  const navigate = useNavigate();
  const [remitos, setRemitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRemitos = async () => {
      try {
        const data = await listRemitos();
        setRemitos(data);
      } catch (err) {
        setError('Error al cargar los remitos.');
        console.error('Error fetching remitos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRemitos();
  }, []);

  const handleCreateRemito = () => {
    navigate('/remitos/crear');
  };

  const handleEditRemito = (id) => {
    navigate(`/remitos/editar/${id}`);
  };

  const handleDeleteRemito = async (id) => {
    // Implement delete logic here
    console.log('Delete remito with ID:', id);
    // After successful deletion, refetch remitos or remove from state
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente/Origen</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {remitos.map((remito) => (
              <TableRow
                key={remito.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {remito.numero}
                </TableCell>
                <TableCell>{remito.tipo}</TableCell>
                <TableCell>{remito.fecha}</TableCell>
                <TableCell>{remito.tipo === 'venta' ? remito.cliente_nombre : remito.origen_nombre}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => handleEditRemito(remito.id)} sx={{ mr: 1 }}>
                    Editar
                  </Button>
                  <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteRemito(remito.id)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VerRemitosList;
