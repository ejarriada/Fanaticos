import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, FormControl, InputLabel, Select,
  MenuItem, Grid, IconButton, CircularProgress, Alert, Paper, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useNavigate, useParams } from 'react-router-dom';
import { getRemito, createRemito, updateRemito, listClients, listProducts, listFactories } from '../../utils/api';

const NuevoRemitoForm = ({ open, onClose, onSave, remito }) => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL for editing
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'venta', // Default to 'venta'
    fecha: new Date().toISOString().split('T')[0], // Default to today's date
    cliente: '',
    origen: '',
    destino: '',
    items: [{ product: '', quantity: '' }],
    observaciones: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [factories, setFactories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dropdown data
        const [clientsData, productsData, factoriesData] = await Promise.all([
          listClients(),
          listProducts(),
          listFactories(),
        ]);
        setClients(clientsData);
        setProducts(productsData);
        setFactories(factoriesData);

        // Fetch remito data if in edit mode
        if (isEditMode) {
          const remitoData = await getRemito(id);
          setFormData({
            numero: remitoData.numero || '',
            tipo: remitoData.tipo || 'venta',
            fecha: remitoData.fecha ? new Date(remitoData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            cliente: remitoData.cliente || '',
            origen: remitoData.origen || '',
            destino: remitoData.destino || '',
            items: remitoData.items && remitoData.items.length > 0 ? remitoData.items.map(item => ({ product: item.product, quantity: item.quantity })) : [{ product: '', quantity: '' }],
            observaciones: remitoData.observaciones || '',
          });
        }
      } catch (err) {
        setError('Error al cargar datos: ' + err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    newItems[index][name] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { product: '', quantity: '' }] }));
  };

  const removeItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems.length > 0 ? newItems : [{ product: '', quantity: '' }] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        await updateRemito(id, formData);
      } else {
        await createRemito(formData);
      }
      navigate('/remitos'); // Go back to remitos list on success
    } catch (err) {
      setError('Error al guardar el remito: ' + err.message);
      console.error('Error saving remito:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{remito ? 'Editar Remito' : 'Crear Nuevo Remito'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Remito"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                disabled={remito} // Number usually not editable after creation
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Remito</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  label="Tipo de Remito"
                  onChange={handleChange}
                >
                  <MenuItem value="venta">Venta</MenuItem>
                  <MenuItem value="interno">Movimiento Interno</MenuItem>
                </Select>
              </FormControl>
            </Grid>

          {formData.tipo === 'venta' && (
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Cliente</InputLabel>
                <Select
                  name="cliente"
                  value={formData.cliente}
                  label="Cliente"
                  onChange={handleChange}
                >
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name} {client.last_name} ({client.cuit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {formData.tipo === 'interno' && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Origen</InputLabel>
                  <Select
                    name="origen"
                    value={formData.origen}
                    label="Origen"
                    onChange={handleChange}
                  >
                    {factories.map(factory => (
                      <MenuItem key={factory.id} value={factory.id}>
                        {factory.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Destino</InputLabel>
                  <Select
                    name="destino"
                    value={formData.destino}
                    label="Destino"
                    onChange={handleChange}
                  >
                    {factories.map(factory => (
                      <MenuItem key={factory.id} value={factory.id}>
                        {factory.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Ítems del Remito
            </Typography>
            {formData.items.map((item, index) => (
              <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Producto</InputLabel>
                    <Select
                      name="product"
                      value={item.product}
                      label="Producto"
                      onChange={(e) => handleItemChange(index, e)}
                    >
                      {products.map(product => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    name="quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    required
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton onClick={() => removeItem(index)} color="error" disabled={formData.items.length === 1}>
                    <RemoveIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined" sx={{ mt: 1 }}>
              Añadir Ítem
            </Button>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              sx={{ mr: 2 }}
            >
              {submitting ? <CircularProgress size={24} /> : (remito ? 'Guardar Cambios' : 'Crear Remito')}
            </Button>
            <Button variant="outlined" onClick={onClose}>
                Cancelar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default NuevoRemitoForm;