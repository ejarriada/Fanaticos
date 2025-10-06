import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, TextField, CircularProgress, Alert, MenuItem,
    Select, InputLabel, FormControl, IconButton, Paper, Divider, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';

const QuotationForm = ({ open, onClose, onSave, quotation }) => {
    const [formData, setFormData] = useState({ 
        client_id: '', 
        date: new Date().toISOString().split('T')[0], 
        details: '', 
        items: [] 
    });
    const [totalAmount, setTotalAmount] = useState(0);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para agregar nuevo producto
    const [newItem, setNewItem] = useState({ product: '', quantity: 1 });

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoading(true);
                const [clientsData, productsData] = await Promise.all([
                    api.list('/clients/'),
                    api.list('/products/?is_manufactured=true'),
                ]);
                
                // Manejar tanto arrays directos como objetos con results
                setClients(Array.isArray(clientsData) ? clientsData : clientsData?.results || []);
                setProducts(Array.isArray(productsData) ? productsData : productsData?.results || []);
            } catch (err) {
                setError('Error al cargar dependencias (clientes, productos).');
            } finally {
                setLoading(false);
            }
        };
        fetchDependencies();
    }, []);

    useEffect(() => {
        if (quotation) {
            setFormData({
                ...quotation,
                date: quotation.date ? new Date(quotation.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                client_id: quotation.client?.id || '',
                items: quotation.items.map(item => ({ 
                    ...item, 
                    product: item.product?.id || item.product,
                    cost: item.cost || '0.00',
                    unit_price: item.unit_price || '0.00'
                })) || [],
            });
        } else {
            setFormData({ 
                client_id: '', 
                date: new Date().toISOString().split('T')[0], 
                details: '', 
                items: [] 
            });
        }
    }, [quotation, open]);

    useEffect(() => {
        const total = formData.items.reduce((sum, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unit_price) || 0;
            return sum + (quantity * unitPrice);
        }, 0);
        setTotalAmount(total);
    }, [formData.items]);

    const handleAddItem = () => {
        if (!newItem.product) {
            setError('Debe seleccionar un producto');
            return;
        }

        const selectedProduct = products.find(p => p.id === newItem.product);
        if (!selectedProduct) return;

         // DEBUG: Ver qué tiene el producto
        console.log('=== DEBUG PRODUCTO SELECCIONADO ===');
        console.log('Producto completo:', selectedProduct);
        console.log('selectedProduct.cost:', selectedProduct.cost);
        console.log('selectedProduct.design:', selectedProduct.design);
        console.log('selectedProduct.design?.calculated_cost:', selectedProduct.design?.calculated_cost);
        console.log('===================================');

        const itemToAdd = {
            product: selectedProduct.id,
            quantity: newItem.quantity,
            unit_price: selectedProduct.club_price || '0.00',
            cost: selectedProduct.cost || '0.00'
        };

        setFormData(prev => ({ ...prev, items: [...prev.items, itemToAdd] }));
        setNewItem({ product: '', quantity: 1 });
        setError(null);
    };

    const handleItemQuantityChange = (index, value) => {
        const newItems = [...formData.items];
        newItems[index].quantity = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleItemPriceChange = (index, value) => {
        const newItems = [...formData.items];
        newItems[index].unit_price = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({ 
            ...prev, 
            items: formData.items.filter((_, i) => i !== index) 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!formData.client_id) {
            setError('Debe seleccionar un cliente');
            return;
        }
        
        if (formData.items.length === 0) {
            setError('Debe agregar al menos un producto');
            return;
        }

        // Validar precio > costo
        const itemsBelowCost = [];
        for (const item of formData.items) {
            if (parseFloat(item.unit_price) <= parseFloat(item.cost)) {
                const productName = products.find(p => p.id === item.product)?.name || 'Producto';
                itemsBelowCost.push(`${productName}: Precio $${item.unit_price} ≤ Costo $${item.cost}`);
            }
        }
        
        if (itemsBelowCost.length > 0) {
            const confirmMsg = `⚠️ ADVERTENCIA: Los siguientes productos tienen precio menor o igual al costo:\n\n${itemsBelowCost.join('\n')}\n\n¿Desea continuar?`;
            if (!window.confirm(confirmMsg)) return;
        }

        const submissionData = { ...formData, total_amount: totalAmount };
        onSave(submissionData);
    };

    if (loading) return <CircularProgress />;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            
            {/* SECCIÓN: Datos del Presupuesto */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ color: '#5c6bc0', fontWeight: 600, mb: 2 }}>
                    Datos del Presupuesto
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl sx={{ flex: '1 1 300px' }} required>
                        <InputLabel>Cliente *</InputLabel>
                        <Select 
                            name="client_id" 
                            value={formData.client_id} 
                            onChange={(e) => setFormData({...formData, client_id: e.target.value})} 
                            label="Cliente *"
                        >
                            {clients.map(client => (
                                <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <TextField 
                        name="date" 
                        label="Fecha *" 
                        type="date" 
                        sx={{ flex: '1 1 200px' }}
                        value={formData.date} 
                        onChange={(e) => setFormData({...formData, date: e.target.value})} 
                        InputLabelProps={{ shrink: true }} 
                        required 
                    />
                </Box>
            </Paper>

            {/* SECCIÓN: Añadir Producto */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ color: '#5c6bc0', fontWeight: 600, mb: 2 }}>
                    Añadir Producto
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <FormControl sx={{ flex: '1 1 300px' }}>
                        <InputLabel>Producto</InputLabel>
                        <Select 
                            value={newItem.product} 
                            onChange={(e) => setNewItem({ ...newItem, product: e.target.value })} 
                            label="Producto"
                        >
                            {products.map(p => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <TextField 
                        label="Cantidad" 
                        type="number" 
                        sx={{ flex: '0 1 150px' }}
                        value={newItem.quantity} 
                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                        inputProps={{ min: "1" }}
                    />
                    
                    <Button 
                        variant="contained" 
                        onClick={handleAddItem}
                        sx={{ height: 56, flex: '0 0 auto' }}
                    >
                        Añadir Producto
                    </Button>
                </Box>
            </Paper>

            {/* SECCIÓN: Productos en Presupuesto */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ color: '#5c6bc0', fontWeight: 600, mb: 2 }}>
                    Productos en Presupuesto
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                {formData.items.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No hay productos agregados. Añade productos desde la sección superior.
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell align="right">Costo</TableCell>
                                    <TableCell align="right">Precio Unit.</TableCell>
                                    <TableCell align="center">Cantidad</TableCell>
                                    <TableCell align="right">Subtotal</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.items.map((item, index) => {
                                    const product = products.find(p => p.id === item.product);
                                    const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                                    const isBelowCost = parseFloat(item.unit_price) <= parseFloat(item.cost);
                                    
                                    return (
                                        <TableRow key={index} sx={{ backgroundColor: isBelowCost ? '#fff3e0' : 'inherit' }}>
                                            <TableCell>
                                                {product?.name || 'Producto desconocido'}
                                                {isBelowCost && (
                                                    <Typography variant="caption" color="warning.main" display="block">
                                                        ⚠️ Precio ≤ Costo
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">${parseFloat(item.cost).toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                <TextField 
                                                    type="number" 
                                                    size="small"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemPriceChange(index, e.target.value)}
                                                    inputProps={{ step: "0.01", min: "0" }}
                                                    sx={{ width: 100 }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField 
                                                    type="number" 
                                                    size="small"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                                                    inputProps={{ min: "1" }}
                                                    sx={{ width: 80 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <strong>${subtotal.toFixed(2)}</strong>
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton onClick={() => removeItem(index)} color="error" size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* SECCIÓN: Finalizar Presupuesto */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ color: '#5c6bc0', fontWeight: 600, mb: 2 }}>
                    Finalizar Presupuesto
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <TextField 
                    label="Detalles Adicionales" 
                    name="details" 
                    multiline 
                    rows={3} 
                    fullWidth 
                    value={formData.details} 
                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                    sx={{ mb: 3 }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Button onClick={onClose} sx={{ mr: 2 }}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" color="success">
                            Guardar Presupuesto
                        </Button>
                    </Box>
                    <Typography variant="h4" sx={{ color: '#5c6bc0', fontWeight: 600 }}>
                        Total: ${totalAmount.toFixed(2)}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default QuotationForm;