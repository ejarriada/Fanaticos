import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import api from '../../utils/api';

const NuevoRemitoForm = ({ open, onClose }) => {
  const [remitoData, setRemitoData] = useState({
    tipo: '',
    origen: '',
    destino: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRemitoData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    // Logic to submit remitoData
    console.log('Remito Data:', remitoData);
    // Example: api.post('/remitos', remitoData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Nuevo Remito</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}>
          <TextField
            name="tipo"
            label="Tipo de Remito"
            value={remitoData.tipo}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            name="origen"
            label="Origen"
            value={remitoData.origen}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            name="destino"
            label="Destino"
            value={remitoData.destino}
            onChange={handleChange}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevoRemitoForm;
