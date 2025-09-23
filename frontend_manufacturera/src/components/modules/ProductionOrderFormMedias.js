import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, 
    FormControl, InputLabel, Select, MenuItem, Typography, Box, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, 
    Divider, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as api from '../../utils/api';

const Section = ({ title, children }) => (
    <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
    </Box>
);

const ProductionOrderFormMedias = ({ open, onClose, onSave, order, creationFlow }) => {
    const [formData, setFormData] = useState({ 
        items: [],
        colors: {},
        specifications: {},
        estimated_delivery_date: '',
        status: 'Pendiente'
    });
    const [currentItem, setCurrentItem] = useState({ size: '', quantity: '', detail: '' });
    const [editingIndex, setEditingIndex] = useState(null);
    
    // File states
    const [productFiles, setProductFiles] = useState([]);

    // Ref for file input
    const fileInputRef = useRef(null);

    // Data for dropdowns
    const [orderNotes, setOrderNotes] = useState([]);
    const [products, setProducts] = useState([]);
    const [colors, setColors] = useState([]);
    const [sellers, setSellers] = useState([]);

    const [loading, setLoading] = useState(false);

    const selectedOrderNote = orderNotes.find(on => on.id === formData.order_note_id);

    useEffect(() => {
        if (!open) return;
        
        const initializeForm = async () => {
            setLoading(true);
            try {
                const colorsPromise = api.list('/colors/');
                const productsPromise = api.list('/products/?is_manufactured=true');
                const notesPromise = api.list('/order-notes/?status=Pendiente');
                const sellersPromise = api.list('/users/');

                const [productsData, notesData, colorsData, sellersData] = await Promise.all([
                    productsPromise, notesPromise, colorsPromise, sellersPromise
                ]);
                
                // Filtrar solo productos que sean medias
                const mediasProducts = (productsData.results || productsData || [])
                    .filter(product => product.name.toLowerCase().includes('media'));
                setProducts(mediasProducts);
                setColors(colorsData.results || colorsData || []);
                setSellers(sellersData.results || sellersData || []);
                
                let allNotes = notesData.results || notesData || [];
                if (order && order.order_note && !allNotes.some(n => n.id === order.order_note.id)) {
                    allNotes = [order.order_note, ...allNotes];
                }
                setOrderNotes(allNotes);

                if (order) {
                    setFormData({
                        ...order,
                        order_note_id: order.order_note?.id || '',
                        base_product_id: order.base_product?.id || '',
                        items: order.items || [],
                        colors: order.colors || {},
                        specifications: order.specifications || {},
                    });
                } else {
                    setFormData({ 
                        items: [],
                        colors: {},
                        specifications: {},
                        estimated_delivery_date: '',
                        status: 'Pendiente'
                    });
                }

            } catch (err) {
                console.error("Failed to init form", err);
            } finally {
                setLoading(false);
            }
        };

        initializeForm();
    }, [open, order, creationFlow]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        
        if (name.startsWith('color_')) {
            const key = name.replace('color_', '');
            setFormData(prev => ({ 
                ...prev, 
                colors: { 
                    ...prev.colors, 
                    [key]: value 
                } 
            }));
        } else if (name.startsWith('spec_')) {
            const key = name.replace('spec_', '');
            setFormData(prev => ({ 
                ...prev, 
                specifications: { 
                    ...prev.specifications, 
                    [key]: value 
                } 
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCurrentItemChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = () => {
        if (!currentItem.size || !currentItem.quantity) return;
        const newItems = [...(formData.items || [])];
        if (editingIndex !== null) {
            newItems[editingIndex] = currentItem;
        } else {
            newItems.push(currentItem);
        }
        setFormData(prev => ({ ...prev, items: newItems }));
        setCurrentItem({ size: '', quantity: '', detail: '' });
        setEditingIndex(null);
    };

    const handleEditItem = (item, index) => {
        setCurrentItem(item);
        setEditingIndex(index);
    };

    const handleRemoveItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setProductFiles(prev => [...prev, ...files]);
    };

    const handleRemoveFile = (index) => {
        setProductFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const data = new FormData();
        
        // Debug: Mostrar los datos que se envían
        console.log('Datos que se envían al backend (Medias):');
        
        // Append main fields
        Object.keys(formData).forEach(key => {
            if (key === 'items' || key === 'colors' || key === 'specifications') {
                data.append(key, JSON.stringify(formData[key]));
                console.log(key, ':', JSON.stringify(formData[key]));
            } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                data.append(key, formData[key]);
                console.log(key, ':', formData[key]);
            }
        });

        // Append files
        productFiles.forEach((file, index) => {
            data.append('product_files', file);
            console.log(`product_files[${index}]:`, file.name);
        });

        onSave(data);
    };

    const renderFileList = (files) => (
        <List dense>
            {files.map((file, index) => (
                <ListItem key={index}>
                    <ListItemText primary={file.name} />
                    <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                            <RemoveCircleOutlineIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
            ))}
        </List>
    );

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            fullWidth 
            maxWidth="lg"
            PaperProps={{
                sx: {
                    height: '90vh',
                    maxHeight: '90vh',
                }
            }}
        >
            <DialogTitle>{order ? 'Editar' : 'Nueva'} Orden de Producción de Medias</DialogTitle>
            <DialogContent 
                sx={{ 
                    minHeight: '600px',
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    padding: 3 
                }}
            >
                {/* === SECCIÓN 1: DATOS DE LA ORDEN === */}
                <Section title="Datos de la Orden">
                    <Grid container spacing={3}>
                        {order && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="ID"
                                    value={order.id || ''}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                        )}
                        
                        {creationFlow === 'fromSale' && (
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Nota de Pedido Asociada</InputLabel>
                                    <Select
                                        value={formData.order_note_id || ''}
                                        label="Nota de Pedido Asociada"
                                        name="order_note_id"
                                        onChange={handleFormChange}
                                    >
                                        {orderNotes.map((note) => (
                                            <MenuItem key={note.id} value={note.id}>
                                                Nota #{note.id} - {note.sale?.client?.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Fecha Estimada de Entrega"
                                name="estimated_delivery_date"
                                type="date"
                                value={selectedOrderNote?.delivery_date || formData.estimated_delivery_date || ''}
                                onChange={handleFormChange}
                                fullWidth
                                disabled={!!selectedOrderNote}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Estado"
                                name="status"
                                value={formData.status || 'Pendiente'}
                                onChange={handleFormChange}
                                fullWidth
                                disabled
                            />
                        </Grid>
                    </Grid>
                </Section>

                {/* === SECCIÓN 2: DATOS DEL CLIENTE === */}
                {selectedOrderNote?.sale?.client && (
                    <Section title="Datos del Cliente">
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Cliente"
                                    value={selectedOrderNote.sale.client.name || ''}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Dirección, Ciudad y Código Postal"
                                    value={`${selectedOrderNote.sale.client.address || ''}, ${selectedOrderNote.sale.client.city || ''}`}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Forma de Envío"
                                    value={selectedOrderNote.shipping_method || ''}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Vendedor</InputLabel>
                                    <Select
                                        value={formData.seller_id || ''}
                                        label="Vendedor"
                                        name="seller_id"
                                        onChange={handleFormChange}
                                    >
                                        {sellers.map((seller) => (
                                            <MenuItem key={seller.id} value={seller.id}>
                                                {seller.first_name} {seller.last_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Section>
                )}

                {/* === SECCIÓN 3: DATOS DEL PEDIDO === */}
                <Section title="Datos del Pedido">
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Producto</InputLabel>
                                <Select
                                    value={formData.base_product_id || ''}
                                    label="Producto"
                                    name="base_product_id"
                                    onChange={handleFormChange}
                                >
                                    {products.map((product) => (
                                        <MenuItem key={product.id} value={product.id}>
                                            {product.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Modelo"
                                name="model"
                                value={formData.model || ''}
                                onChange={handleFormChange}
                                fullWidth
                                placeholder="Especificar modelo de medias"
                            />
                        </Grid>
                    </Grid>
                </Section>

                {/* === SECCIÓN 4: DETALLE DEL PEDIDO === */}
                <Section title="Detalle del Pedido">
                    <TextField
                        label="Detalles"
                        name="details"
                        value={formData.details || ''}
                        onChange={handleFormChange}
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Detalles específicos del pedido de medias"
                    />
                </Section>

                {/* === SECCIÓN 5: PLANTILLA DE TALLES === */}
                <Section title="Plantilla de Talles">
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Talle</InputLabel>
                                <Select
                                    value={currentItem.size}
                                    label="Talle"
                                    name="size"
                                    onChange={handleCurrentItemChange}
                                >
                                    <MenuItem value="35-37">35-37</MenuItem>
                                    <MenuItem value="38-40">38-40</MenuItem>
                                    <MenuItem value="41-43">41-43</MenuItem>
                                    <MenuItem value="44-46">44-46</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Cantidad"
                                name="quantity"
                                type="number"
                                value={currentItem.quantity}
                                onChange={handleCurrentItemChange}
                                fullWidth
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Detalle Talle"
                                name="detail"
                                value={currentItem.detail}
                                onChange={handleCurrentItemChange}
                                fullWidth
                                placeholder="Detalles específicos del talle"
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button
                                variant="contained"
                                onClick={handleAddItem}
                                fullWidth
                                disabled={!currentItem.size || !currentItem.quantity}
                                sx={{ height: '56px' }}
                            >
                                {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                            </Button>
                        </Grid>
                    </Grid>

                    {formData.items && formData.items.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Listado de Talles - Total: {formData.items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0)} pares
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Talle</TableCell>
                                            <TableCell>Cantidad</TableCell>
                                            <TableCell>Detalle</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.size}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>{item.detail}</TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditItem(item, index)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <RemoveCircleOutlineIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Section>

                {/* === SECCIÓN 6: COLORES === */}
                <Section title="Colores">
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Color Base</InputLabel>
                                <Select
                                    value={formData.colors?.base || ''}
                                    label="Color Base"
                                    name="color_base"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.name}>
                                            {color.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Color Secundario</InputLabel>
                                <Select
                                    value={formData.colors?.secundario || ''}
                                    label="Color Secundario"
                                    name="color_secundario"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.name}>
                                            {color.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Color Puño</InputLabel>
                                <Select
                                    value={formData.colors?.puno || ''}
                                    label="Color Puño"
                                    name="color_puno"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.name}>
                                            {color.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Color Puntera</InputLabel>
                                <Select
                                    value={formData.colors?.puntera || ''}
                                    label="Color Puntera"
                                    name="color_puntera"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.name}>
                                            {color.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Color Talón</InputLabel>
                                <Select
                                    value={formData.colors?.talon || ''}
                                    label="Color Talón"
                                    name="color_talon"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.name}>
                                            {color.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Section>

                {/* === SECCIÓN 7: ESPECIFICACIONES TÉCNICAS === */}
                <Section title="Especificaciones Técnicas">
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Máquina"
                                name="spec_maquina"
                                value={formData.specifications?.maquina || ''}
                                onChange={handleFormChange}
                                fullWidth
                                placeholder="Tipo de máquina a utilizar"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Agujas"
                                name="spec_agujas"
                                value={formData.specifications?.agujas || ''}
                                onChange={handleFormChange}
                                fullWidth
                                placeholder="Especificación de agujas"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Observaciones"
                                name="spec_observaciones"
                                value={formData.specifications?.observaciones || ''}
                                onChange={handleFormChange}
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Observaciones técnicas adicionales"
                            />
                        </Grid>
                    </Grid>
                </Section>

                {/* === SECCIÓN 8: ARCHIVOS === */}
                <Section title="Archivos">
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                                Agregar Archivos
                                <input type="file" hidden multiple onChange={handleFileChange} ref={fileInputRef} />
                            </Button>
                            {renderFileList(productFiles)}
                        </Grid>
                    </Grid>
                </Section>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Orden de Producción</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductionOrderFormMedias;