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
    const [productsFromSale, setProductsFromSale] = useState([]); // Productos de la venta seleccionada
    const [colors, setColors] = useState([]);

    const [loading, setLoading] = useState(false);

    const selectedOrderNote = orderNotes.find(on => on.id === formData.order_note_id);
    
    // Talles predefinidos para medias (no vienen del producto)
    const mediaSizes = [
        { id: 1, name: '35-37' },
        { id: 2, name: '38-40' },
        { id: 3, name: '41-43' },
        { id: 4, name: '44-46' }
    ];
    
    // Verificar si todos los talles ya fueron usados
    const usedSizes = (formData.items || []).map(item => item.size);
    const allSizesUsed = mediaSizes.every(size => usedSizes.includes(size.name)) && editingIndex === null;

    useEffect(() => {
        if (!open) return;
        
        const initializeForm = async () => {
            setLoading(true);
            try {
                const colorsPromise = api.list('/colors/');
                const notesPromise = api.list('/order-notes/?status=Pendiente');

                const [notesData, colorsData] = await Promise.all([
                    notesPromise, colorsPromise
                ]);
                
                setColors(colorsData.results || colorsData || []);
                
                let allNotes = notesData.results || notesData || [];
                
                allNotes = allNotes.filter(note => {
                    if (!note.sale || !note.sale.items) return false;
                    return note.sale.items.some(item => 
                        item.product?.name?.toLowerCase().includes('media')
                    );
                });
                
                if (order && order.order_note && !allNotes.some(n => n.id === order.order_note.id)) {
                    allNotes = [order.order_note, ...allNotes];
                }
                setOrderNotes(allNotes);

                if (order) {
                    console.log('🔵 ORDER COMPLETA:', order);
                    console.log('🔵 order.specifications:', order.specifications);
                    console.log('🔵 order.colors:', order.colors);
                    
                    let specsObject = {};
                    try {
                        if (order.specifications && typeof order.specifications === 'string') {
                            specsObject = JSON.parse(order.specifications);
                        } else if (order.specifications && typeof order.specifications === 'object') {
                            specsObject = order.specifications;
                        }
                    } catch (e) {
                        console.error("Could not parse specifications JSON string: ", order.specifications);
                    }
                    
                    console.log('🔵 specsObject parseado:', specsObject);
                    
                    // ===== RECONSTRUIR colors (compatible con versiones antiguas y nuevas) =====
                    let colorsMap = {};
                    
                    // CASO 1: Colores guardados en specifications (nuevo formato)
                    if (specsObject.color_base || specsObject.color_secundario || specsObject.color_puno || 
                        specsObject.color_puntera || specsObject.color_talon) {
                        colorsMap = {
                            base: specsObject.color_base || null,
                            secundario: specsObject.color_secundario || null,
                            puno: specsObject.color_puno || null,
                            puntera: specsObject.color_puntera || null,
                            talon: specsObject.color_talon || null,
                        };
                        console.log('✅ Colores cargados desde specifications (nuevo formato)');
                    }
                    // CASO 2: Colores en el array order.colors (formato antiguo - fallback)
                    else if (order.colors && Array.isArray(order.colors)) {
                        // Intentar mapear por posición (mejor que nada para órdenes antiguas)
                        colorsMap = {
                            base: order.colors[0]?.id || null,
                            secundario: order.colors[1]?.id || null,
                            puno: order.colors[2]?.id || null,
                            puntera: order.colors[3]?.id || null,
                            talon: order.colors[4]?.id || null,
                        };
                        console.log('⚠️ Colores cargados desde array (formato antiguo)');
                    }
                    // CASO 3: Sin colores
                    else {
                        colorsMap = {
                            base: null,
                            secundario: null,
                            puno: null,
                            puntera: null,
                            talon: null,
                        };
                        console.log('ℹ️ Sin colores para cargar');
                    }
                    
                    console.log('🔵 colorsMap reconstruido:', colorsMap);
                    
                    // Limpiar colores de specifications para no duplicar
                    const { color_base, color_secundario, color_puno, color_puntera, color_talon, ...cleanSpecs } = specsObject;
                    // ===================================================
                    
                    const itemsWithIds = (order.items || []).map((item) => {
                        if (typeof item.size === 'number') {
                            return item;
                        }
                        
                        const talleObj = mediaSizes.find(s => {
                            const match = s.name === item.size || s.name === String(item.size);
                            return match;
                        });
                        
                        const result = {
                            ...item,
                            size: talleObj ? talleObj.id : item.size
                        };
                        
                        return result;
                    });
                    
                    setFormData({
                        ...order,
                        order_note_id: order.order_note?.id || '',
                        base_product_id: order.base_product?.id || '',
                        items: itemsWithIds,
                        colors: colorsMap,
                        specifications: cleanSpecs,
                    });
                    
                    if (order.order_note?.sale?.items) {
                        const products = order.order_note.sale.items
                            .map(item => item.product)
                            .filter(p => p && p.name?.toLowerCase().includes('media'));
                        setProductsFromSale(products);
                    }
                }

            } catch (err) {
                console.error("Failed to init form", err);
            } finally {
                setLoading(false);
            }
        };

        initializeForm();
    }, [open, order, creationFlow]);

    // NUEVO: Cargar productos cuando se selecciona una nota de pedido
    useEffect(() => {
        if (formData.order_note_id && selectedOrderNote?.sale?.items) {
            // FILTRO 2: Extraer solo productos "Medias" de la venta
            const mediasProducts = selectedOrderNote.sale.items
                .map(item => item.product)
                .filter(p => p && p.name?.toLowerCase().includes('media'))
                .filter((product, index, self) => 
                    // Eliminar duplicados por ID
                    index === self.findIndex(p => p.id === product.id)
                );
            
            setProductsFromSale(mediasProducts);
            
            // Si solo hay un producto, seleccionarlo automáticamente
            if (mediasProducts.length === 1 && !order) {
                setFormData(prev => ({
                    ...prev,
                    base_product_id: mediasProducts[0].id
                }));
            }
        }
    }, [formData.order_note_id, selectedOrderNote, order]);

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
        if (!currentItem.size || !currentItem.quantity || !formData.base_product_id) return;
        
        // VALIDACIÓN 1: No permitir talles duplicados (excepto al editar)
        const existingTalles = (formData.items || [])
            .filter((_, index) => index !== editingIndex)
            .map(item => item.size);
        
        if (existingTalles.includes(currentItem.size)) {
            alert(`⚠️ El talle ${currentItem.size} ya fue agregado. No se permiten talles duplicados.`);
            return;
        }
        
        // VALIDACIÓN 2: No exceder la cantidad vendida del producto seleccionado
        const quantitySoldForProduct = selectedOrderNote?.sale?.items
            .filter(item => item.product?.id === parseInt(formData.base_product_id))
            .reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        
        // Calcular total ya agregado (excluyendo el item en edición)
        const currentTotal = (formData.items || [])
            .filter((_, index) => index !== editingIndex)
            .reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
        
        const newTotal = currentTotal + parseInt(currentItem.quantity);
        
        if (newTotal > quantitySoldForProduct) {
            alert(`⚠️ Cantidad excedida!\n\nVendido: ${quantitySoldForProduct} pares\nYa agregado: ${currentTotal} pares\nIntentando agregar: ${currentItem.quantity} pares\n\nTotal disponible: ${quantitySoldForProduct - currentTotal} pares`);
            return;
        }
        
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
        
        console.log('💾 === GUARDANDO ORDEN ===');
        console.log('💾 formData.colors:', formData.colors);
        
        // ===== NUEVO: Guardar colores en specifications =====
        const specificationsWithColors = {
            ...(formData.specifications || {}),
            color_base: formData.colors?.base || null,
            color_secundario: formData.colors?.secundario || null,
            color_puno: formData.colors?.puno || null,
            color_puntera: formData.colors?.puntera || null,
            color_talon: formData.colors?.talon || null,
        };
        
        console.log('💾 specificationsWithColors:', specificationsWithColors);
        
        // ===== IMPORTANTE: Separar colors para el ManyToMany =====
        const selectedColorIds = Object.values(formData.colors || {})
            .filter(id => id !== '' && id !== null && id !== undefined)
            .map(Number);

        console.log('💾 selectedColorIds:', selectedColorIds);

        // ===== Items deben incluir product_id =====
        const itemsWithProduct = (formData.items || []).map(item => {
            const talleObj = mediaSizes.find(s => s.id === parseInt(item.size));
            const talleName = talleObj ? talleObj.name : item.size;
            
            return {
                size: talleName,
                quantity: item.quantity,
                detail: item.detail || '',
                product: formData.base_product_id
            };
        });

        // ===== MODIFICADO: Specifications CON colores =====
        const specificationsStr = JSON.stringify(specificationsWithColors);
        
        console.log('💾 specificationsStr:', specificationsStr);

        const backendData = {
            order_note: formData.order_note_id || null,
            base_product: formData.base_product_id || null,
            estimated_delivery_date: formData.estimated_delivery_date || null,
            status: formData.status,
            model: formData.model || '',
            details: formData.details || '',
            items: itemsWithProduct,
            specifications: specificationsStr, // ← CON COLORES
            color_ids: selectedColorIds,
        };
        
        if (order && order.id) {
            backendData.id = order.id;
        }

        // Agregar campos al FormData
        Object.keys(backendData).forEach(key => {
            if (key === 'items') {
                data.append(key, JSON.stringify(backendData[key]));
            } else if (key === 'color_ids') {
                backendData[key].forEach(colorId => {
                    data.append(key, colorId);
                });
            } else if (backendData[key] !== null && backendData[key] !== undefined) {
                data.append(key, backendData[key]);
            }
        });
        
        data.append('op_type', 'Medias');
        
        productFiles.forEach((file) => {
            data.append('product_files', file);
        });
        
        console.log('💾 === FIN GUARDANDO ===');
        
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
                                <FormControl fullWidth required sx={{ minWidth: 200 }}>
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
                                value={selectedOrderNote?.estimated_delivery_date || formData.estimated_delivery_date || ''}
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
                                <TextField
                                    label="Vendedor"
                                    value={selectedOrderNote?.sale?.user?.first_name 
                                        ? `${selectedOrderNote.sale.user.first_name} ${selectedOrderNote.sale.user.last_name || ''}`.trim()
                                        : 'N/A'}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Section>
                )}

                {/* === SECCIÓN 3: DATOS DEL PEDIDO === */}
                <Section title="Datos del Pedido">
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required sx={{ minWidth: 200 }}>
                                <InputLabel>Producto</InputLabel>
                                <Select
                                    value={formData.base_product_id || ''}
                                    label="Producto"
                                    name="base_product_id"
                                    onChange={handleFormChange}
                                    disabled={productsFromSale.length === 0}
                                >
                                    {productsFromSale.length > 0 ? (
                                        productsFromSale.map((product) => (
                                            <MenuItem key={product.id} value={product.id}>
                                                {product.name}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled value="">
                                            Seleccione una Nota de Pedido primero
                                        </MenuItem>
                                    )}
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
                            <FormControl fullWidth required sx={{ minWidth: 200 }}>
                                <InputLabel>Talle</InputLabel>
                                <Select
                                    value={currentItem.size}
                                    label="Talle"
                                    name="size"
                                    onChange={handleCurrentItemChange}
                                >
                                    {mediaSizes.map((size) => (
                                        <MenuItem key={size.id} value={size.id}>
                                            {size.name}
                                        </MenuItem>
                                    ))}
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
                                disabled={!currentItem.size || !currentItem.quantity || !formData.base_product_id || allSizesUsed}
                                sx={{ height: '56px' }}
                                title={allSizesUsed ? 'Todos los talles disponibles ya fueron agregados' : ''}
                            >
                                {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                            </Button>
                        </Grid>
                    </Grid>

                    {formData.items && formData.items.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Listado de Talles - Total: {formData.items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0)} pares
                                {selectedOrderNote?.sale?.items && formData.base_product_id && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                        (Vendido: {selectedOrderNote.sale.items
                                            .filter(item => item.product?.id === parseInt(formData.base_product_id))
                                            .reduce((sum, item) => sum + (item.quantity || 0), 0)} pares)
                                    </Typography>
                                )}
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
                                                <TableCell>{mediaSizes.find(s => s.id === item.size)?.name || item.size}</TableCell>
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
                            <FormControl fullWidth required sx={{ minWidth: 200 }}>
                                <InputLabel>Color Base</InputLabel>
                                <Select
                                    value={formData.colors?.base || ''}
                                    label="Color Base"
                                    name="color_base"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.id}>
                                            {color.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required sx={{ minWidth: 200 }}>
                                <InputLabel>Color Secundario</InputLabel>
                                <Select
                                    value={formData.colors?.secundario || ''}
                                    label="Color Secundario"
                                    name="color_secundario"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.id}>
                                            {color.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required sx={{ minWidth: 200 }}>
                                <InputLabel>Color Puño</InputLabel>
                                <Select
                                    value={formData.colors?.puno || ''}
                                    label="Color Puño"
                                    name="color_puno"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.id}>
                                            {color.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required sx={{ minWidth: 200 }}>
                                <InputLabel>Color Puntera</InputLabel>
                                <Select
                                    value={formData.colors?.puntera || ''}
                                    label="Color Puntera"
                                    name="color_puntera"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.id}>
                                            {color.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required sx={{ minWidth: 200 }}>
                                <InputLabel>Color Talón</InputLabel>
                                <Select
                                    value={formData.colors?.talon || ''}
                                    label="Color Talón"
                                    name="color_talon"
                                    onChange={handleFormChange}
                                >
                                    {colors.map((color) => (
                                        <MenuItem key={color.id} value={color.id}>
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