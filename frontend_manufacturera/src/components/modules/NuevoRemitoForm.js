import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem,
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Alert, Grid, Divider, Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import * as api from '../../utils/api';

const NuevoRemitoForm = () => {
    const [formData, setFormData] = useState({
        tipo: 'Venta',
        fecha: new Date().toISOString().split('T')[0],
        cliente: '',
        origen: '',
        destino: '',
        observaciones: '',
        estado: 'Pendiente'
    });
    
    const [items, setItems] = useState([]);
    const [currentItem, setCurrentItem] = useState({
        codigo_barras: '',
        producto: '',
        cantidad: ''
    });
    
    // Estados para dropdowns
    const [clientes, setClientes] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productosInventario, setProductosInventario] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [ventaSeleccionada, setVentaSeleccionada] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [clientesData, productosData, ventasData, almacenesData] = await Promise.all([
                    api.list('/clients/'),
                    api.list('/products/'),
                    api.list('/sales/'),
                    api.list('/warehouses/')  // ← Cargar almacenes reales
                ]);
                
                setClientes(clientesData.results || clientesData || []);
                setProductos(productosData.results || productosData || []);
                setVentas(ventasData.results || ventasData || []);
                setAlmacenes(almacenesData.results || almacenesData || []);  // ← Usar almacenes reales
                
            } catch (err) {
                setError('Error al cargar los datos iniciales.');
                console.error(err);
            }
        };

        fetchInitialData();
    }, []);

    // Cargar inventario según almacén origen seleccionado
    useEffect(() => {
        if (formData.origen) {
            // TODO: Implementar cuando esté disponible el endpoint de inventario por almacén
            // fetchInventarioByAlmacen(formData.origen);
            setProductosInventario(productos); // Por ahora usar todos los productos
        }
    }, [formData.origen, productos]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCurrentItemChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Simulador de lector de código de barras
    const handleCodigoBarrasSimulado = () => {
        // Simular escaneo de código de barras
        const randomProduct = productosInventario[Math.floor(Math.random() * productosInventario.length)];
        if (randomProduct) {
            setCurrentItem(prev => ({
                ...prev,
                codigo_barras: `BAR${randomProduct.id}${Date.now()}`,
                producto: randomProduct.id
            }));
        }
    };

    const handleProductoChange = (event, value) => {
        setCurrentItem(prev => ({
            ...prev,
            producto: value?.id || '',
            codigo_barras: value ? `BAR${value.id}` : ''
        }));
    };

    const handleAgregarItem = () => {
        if (!currentItem.producto || !currentItem.cantidad) {
            setError('Complete todos los campos del producto.');
            return;
        }

        const producto = productos.find(p => p.id === currentItem.producto);
        if (!producto) {
            setError('Producto no encontrado.');
            return;
        }

        const newItem = {
            id: Date.now(),
            codigo_barras: currentItem.codigo_barras,
            producto_id: currentItem.producto,
            producto_nombre: producto.name,
            cantidad: parseInt(currentItem.cantidad),
            stock_disponible: 100 // TODO: Obtener del inventario real
        };

        setItems(prev => [...prev, newItem]);
        setCurrentItem({
            codigo_barras: '',
            producto: '',
            cantidad: ''
        });
        setError(null);
    };

    const handleEliminarItem = (itemId) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleItemQuantityChange = (itemId, newQuantity) => {
        const quantity = parseInt(newQuantity, 10);
        setItems(prev => 
            prev.map(item => 
                item.id === itemId ? { ...item, cantidad: isNaN(quantity) ? 0 : quantity } : item
            )
        );
    };

    const handleSubmit = async () => {
        if (!formData.tipo || !formData.fecha || !formData.origen) {
            setError('Complete los campos obligatorios: Tipo, Fecha y Origen.');
            return;
        }

        if (formData.tipo === 'Venta' && !formData.cliente) {
            setError('Para remitos de venta debe seleccionar un cliente.');
            return;
        }

        if (items.length === 0) {
            setError('Debe agregar al menos un producto al remito.');
            return;
        }

        try {
            setLoading(true);
            
            const remitoData = {
                tipo: formData.tipo,
                fecha: formData.fecha,
                cliente: formData.tipo === 'Venta' ? formData.cliente : null,
                venta_asociada: ventaSeleccionada || null,
                origen: formData.origen,
                destino: formData.tipo === 'Interno' ? formData.destino : null,
                observaciones: formData.observaciones,
                estado: formData.estado,
                items: items.map(item => ({
                    product_id: item.producto_id,
                    quantity: item.cantidad
                }))
            };

            console.log('📦 Datos a enviar:', remitoData);  // ← AGREGAR ESTE LOG

            await api.create('/delivery-notes/', remitoData);
            
            setSuccess('Remito creado exitosamente.');
            setError(null);
            
            // Limpiar formulario
            setFormData({
                tipo: 'Venta',
                fecha: new Date().toISOString().split('T')[0],
                cliente: '',
                origen: '',
                destino: '',
                observaciones: '',
                estado: 'Pendiente'
            });
            setItems([]);
            
        } catch (err) {
            setError('Error al crear el remito.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Datos del Remito</Typography>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Tipo de Remito</InputLabel>
                            <Select
                                name="tipo"
                                value={formData.tipo}
                                label="Tipo de Remito"
                                onChange={handleFormChange}
                            >
                                <MenuItem value="Venta">Venta</MenuItem>
                                <MenuItem value="Interno">Interno</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            name="fecha"
                            label="Fecha"
                            type="date"
                            value={formData.fecha}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {formData.tipo === 'Venta' && (
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required sx={{ minWidth: 200 }}>
                                <InputLabel>Cliente</InputLabel>
                                <Select
                                    name="cliente"
                                    value={formData.cliente}
                                    label="Cliente"
                                    onChange={handleFormChange}
                                >
                                    {clientes.map(cliente => (
                                        <MenuItem key={cliente.id} value={cliente.id}>
                                            {cliente.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    {formData.tipo === 'Venta' && (
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth sx={{ minWidth: 200 }}>
                                <InputLabel>Venta Asociada (Opcional)</InputLabel>
                                <Select
                                    name="venta"
                                    value={ventaSeleccionada}
                                    label="Venta Asociada (Opcional)"
                                    onChange={async (e) => {
                                        const selectedVentaId = e.target.value;
                                        setVentaSeleccionada(selectedVentaId);

                                        if (selectedVentaId) {
                                            const venta = ventas.find(v => v.id === selectedVentaId);
                                            if (venta) {
                                                setFormData(prev => ({ ...prev, cliente: venta.client.id }));
                                                
                                                // Crear items con nombres de productos correctos
                                                const itemsDeVenta = venta.items.map(itemVenta => {
                                                    return {
                                                        id: `venta-${itemVenta.id}`,
                                                        codigo_barras: `BAR-VENTA-${itemVenta.product}`,
                                                        producto_id: typeof itemVenta.product === 'object' ? itemVenta.product.id : itemVenta.product,
                                                        producto_nombre: itemVenta.product_name || 
                                                                        productos.find(p => p.id === (typeof itemVenta.product === 'object' ? itemVenta.product.id : itemVenta.product))?.name || 
                                                                        `Producto ID: ${typeof itemVenta.product === 'object' ? itemVenta.product.id : itemVenta.product}`,
                                                        cantidad: itemVenta.quantity,
                                                        stock_disponible: 'N/A'
                                                    };
                                                });
                                                setItems(itemsDeVenta);
                                            }
                                        } else {
                                            setItems([]);
                                        }
                                    }}
                                    disabled={!formData.cliente}
                                >
                                    <MenuItem value=""><em>Ninguna</em></MenuItem>
                                    {ventas
                                        .filter(venta => {
                                            // Filtrar solo ventas del cliente seleccionado
                                            const clienteId = typeof venta.client === 'object' ? venta.client.id : venta.client;
                                            return clienteId === formData.cliente;
                                        })
                                        .map(venta => (
                                            <MenuItem key={venta.id} value={venta.id}>
                                                {`Venta #${venta.id} - ${new Date(venta.sale_date).toLocaleDateString()} - $${venta.total_amount || 0}`}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>
                            {formData.cliente && ventas.filter(v => {
                                const clienteId = typeof v.client === 'object' ? v.client.id : v.client;
                                return clienteId === formData.cliente;
                            }).length === 0 && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Este cliente no tiene ventas registradas.
                                </Typography>
                            )}
                        </Grid>
                    )}

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required sx={{ minWidth: 200 }}>
                            <InputLabel>Origen (Almacén)</InputLabel>
                            <Select
                                name="origen"
                                value={formData.origen}
                                label="Origen (Almacén)"
                                onChange={handleFormChange}
                            >
                                {almacenes.map(almacen => (
                                    <MenuItem key={almacen.id} value={almacen.id}>
                                        {almacen.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ minWidth: 200 }}>
                            <InputLabel>Destino</InputLabel>
                            <Select
                                name="destino"
                                value={formData.destino}
                                label="Destino"
                                onChange={handleFormChange}
                            >
                                {formData.tipo === 'Venta' ? (
                                    // Solo mostrar el cliente seleccionado
                                    formData.cliente ? (
                                        <MenuItem value={formData.cliente}>
                                            {clientes.find(c => c.id === formData.cliente)?.name || 'Cliente'} (Cliente)
                                        </MenuItem>
                                    ) : (
                                        <MenuItem value="" disabled>
                                            <em>Primero seleccione un cliente</em>
                                        </MenuItem>
                                    )
                                ) : (
                                    // Para remitos internos, mostrar todos los almacenes excepto el origen
                                    almacenes
                                        .filter(almacen => almacen.id !== formData.origen)
                                        .map(almacen => (
                                            <MenuItem key={`almacen-${almacen.id}`} value={almacen.id}>
                                                {almacen.name} (Almacén)
                                            </MenuItem>
                                        ))
                                )}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            name="observaciones"
                            label="Observaciones"
                            value={formData.observaciones}
                            onChange={handleFormChange}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Observaciones adicionales del remito"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>Agregar Productos</Typography>
                
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={2}>
                        <TextField
                            name="codigo_barras"
                            label="Código de Barras"
                            value={currentItem.codigo_barras}
                            onChange={handleCurrentItemChange}
                            fullWidth
                            placeholder="Escanear o ingresar"
                            InputProps={{
                                endAdornment: (
                                    <IconButton 
                                        onClick={handleCodigoBarrasSimulado}
                                        color="primary"
                                        title="Simular escaneo"
                                    >
                                        <QrCodeScannerIcon />
                                    </IconButton>
                                )
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Autocomplete
                            options={productosInventario}
                            getOptionLabel={(option) => option.name || ''}
                            value={productos.find(p => p.id === currentItem.producto) || null}
                            onChange={handleProductoChange}
                            renderInput={(params) => (
                                <TextField {...params} label="Producto" fullWidth />
                            )}
                            disabled={!formData.origen}
                            ListboxProps={{
                                style: {
                                    maxHeight: '400px',
                                }
                            }}
                            componentsProps={{
                                popper: {
                                    style: {
                                        width: 'fit-content',
                                        minWidth: '500px'
                                    }
                                }
                            }}
                            renderOption={(props, option) => (
                                <li {...props} style={{ whiteSpace: 'normal', padding: '8px 16px' }}>
                                    <Box>
                                        <Typography variant="body1" component="div">
                                            {option.name}
                                        </Typography>
                                        {option.sku && (
                                            <Typography variant="caption" color="text.secondary">
                                                SKU: {option.sku}
                                            </Typography>
                                        )}
                                    </Box>
                                </li>
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            name="cantidad"
                            label="Cantidad"
                            type="number"
                            value={currentItem.cantidad}
                            onChange={handleCurrentItemChange}
                            fullWidth
                            inputProps={{ min: 1 }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Button
                            variant="contained"
                            onClick={handleAgregarItem}
                            startIcon={<AddIcon />}
                            disabled={!currentItem.producto || !currentItem.cantidad}
                            fullWidth
                        >
                            Agregar
                        </Button>
                    </Grid>
                </Grid>

                {!formData.origen && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Seleccione un almacén de origen para ver los productos disponibles.
                    </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>Items del Remito</Typography>
                
                {items.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                        No hay productos agregados al remito.
                    </Typography>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Código de Barras</strong></TableCell>
                                    <TableCell><strong>Producto</strong></TableCell>
                                    <TableCell><strong>Cantidad</strong></TableCell>
                                    <TableCell><strong>Stock Disponible</strong></TableCell>
                                    <TableCell><strong>Acciones</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.codigo_barras}</TableCell>
                                        <TableCell>{item.producto_nombre}</TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={item.cantidad}
                                                onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                                                inputProps={{ min: 0, style: { maxWidth: '80px' } }}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{item.stock_disponible}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => handleEliminarItem(item.id)}
                                                color="error"
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || items.length === 0}
                        size="large"
                    >
                        {loading ? 'Guardando...' : 'Crear Remito'}
                    </Button>
                    
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setFormData({
                                tipo: 'Venta',
                                fecha: new Date().toISOString().split('T')[0],
                                cliente: '',
                                origen: '',
                                destino: '',
                                observaciones: '',
                                estado: 'Pendiente'
                            });
                            setItems([]);
                            setCurrentItem({ codigo_barras: '', producto: '', cantidad: '' });
                        }}
                    >
                        Limpiar Formulario
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default NuevoRemitoForm;