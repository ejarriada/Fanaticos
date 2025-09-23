import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, 
    FormControl, InputLabel, Select, MenuItem, Typography, Box, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Divider, Checkbox, FormControlLabel, List, ListItem, ListItemText, ListItemSecondaryAction
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

const ProductionOrderFormIndumentaria = ({ open, onClose, onSave, order, creationFlow }) => {
    const [formData, setFormData] = useState({ items: [] });
    const [currentItem, setCurrentItem] = useState({ size: '', quantity: '', is_goalie: false });
    const [editingIndex, setEditingIndex] = useState(null);
    
    // File states
    const [escudoFiles, setEscudoFiles] = useState([]);
    const [sponsorFiles, setSponsorFiles] = useState([]);
    const [templateFiles, setTemplateFiles] = useState([]);

    // Refs for file inputs
    const escudoInputRef = useRef(null);
    const sponsorInputRef = useRef(null);
    const templateInputRef = useRef(null);

    // Data for dropdowns
    const [orderNotes, setOrderNotes] = useState([]);
    const [products, setProducts] = useState([]);
    const [colors, setColors] = useState([]);

    const [loading, setLoading] = useState(false);

    const selectedOrderNote = orderNotes.find(on => on.id === formData.order_note);
    const selectedBaseProduct = React.useMemo(() => {
        if (!formData.base_product) return null;
        const product = products.find(p => p.id === parseInt(formData.base_product));
        if (!product) return null;
        if (product.design && product.design.sizes && !product.sizes) {
            return { ...product, sizes: product.design.sizes };
        }
        return product;
    }, [products, formData.base_product]);

    // Modificación para el useEffect que inicializa el formulario
    // Reemplazar la sección de carga de productos

    useEffect(() => {
        if (!open) return;
        
        const initializeForm = async () => {
            setLoading(true);
            try {
                const colorsPromise = api.list('/colors/');
                const productsPromise = api.list('/products/?is_manufactured=true');
                const notesPromise = api.list('/order-notes/?status=Pendiente');

                const [productsData, notesData, colorsData] = await Promise.all([productsPromise, notesPromise, colorsPromise]);
                
                // Cargar productos SIN intentar cargar talles todavía
                setProducts(productsData.results || productsData || []);
                setColors(colorsData.results || colorsData || []);
                
                let allNotes = notesData.results || notesData || [];
                if (order && order.order_note && !allNotes.some(n => n.id === order.order_note.id)) {
                    allNotes = [order.order_note, ...allNotes];
                }
                setOrderNotes(allNotes);

                if (order) {
                    setFormData({
                        ...order,
                        order_note: order.order_note?.id || '',
                        base_product: order.base_product?.id || '',
                        items: order.items || [],
                        customization_details: order.customization_details || {},
                    });
                } else {
                    setFormData({ items: [], customization_details: {} });
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
        if (name.startsWith('customization_')) {
            const key = name.replace('customization_', '');
            setFormData(prev => ({ ...prev, customization_details: { ...prev.customization_details, [key]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCurrentItemChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentItem(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
        setCurrentItem({ size: '', quantity: '', is_goalie: false });
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

    const handleFileChange = (event, fileType) => {
        const files = Array.from(event.target.files);
        if (fileType === 'escudo') setEscudoFiles(prev => [...prev, ...files]);
        if (fileType === 'sponsor') setSponsorFiles(prev => [...prev, ...files]);
        if (fileType === 'template') setTemplateFiles(prev => [...prev, ...files]);
    };

    const handleRemoveFile = (index, fileType) => {
        if (fileType === 'escudo') setEscudoFiles(prev => prev.filter((_, i) => i !== index));
        if (fileType === 'sponsor') setSponsorFiles(prev => prev.filter((_, i) => i !== index));
        if (fileType === 'template') setTemplateFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const data = new FormData();
        
        // Append main fields
        Object.keys(formData).forEach(key => {
            if (key === 'items' || key === 'customization_details') {
                data.append(key, JSON.stringify(formData[key]));
            } else if (formData[key] !== null && formData[key] !== undefined) {
                data.append(key, formData[key]);
            }
        });

        // Add the required op_type
        data.append('op_type', 'Indumentaria');

        // Append files
        escudoFiles.forEach(file => data.append('escudo_files', file));
        sponsorFiles.forEach(file => data.append('sponsor_files', file));
        templateFiles.forEach(file => data.append('template_files', file));

        onSave(data);
    };

    const renderFileList = (files, fileType) => (
        <List dense>
            {files.map((file, index) => (
                <ListItem key={index}>
                    <ListItemText primary={file.name} />
                    <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveFile(index, fileType)}>
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
            <DialogTitle>{order ? 'Editar' : 'Nueva'} Orden de Producción de Indumentaria</DialogTitle>
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
                    <Grid container spacing={2}>
                        {order && (
                            <Grid xs={12} sm={6}>
                                <TextField
                                    label="ID"
                                    value={order.id || ''}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                        )}
                        
                        {creationFlow === 'fromSale' && (
                            <Grid xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Nota de Pedido Asociada</InputLabel>
                                    <Select
                                        value={formData.order_note || ''}
                                        label="Nota de Pedido Asociada"
                                        name="order_note"
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

                        <Grid xs={12} sm={6}>
                            <TextField
                                label="Equipo"
                                name="equipo"
                                value={formData.equipo || ''}
                                onChange={handleFormChange}
                                fullWidth
                            />
                        </Grid>

                        <Grid xs={12}>
                            <TextField
                                label="Detalle del Equipo"
                                name="detalle_equipo"
                                value={formData.detalle_equipo || ''}
                                onChange={handleFormChange}
                                fullWidth
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </Section>
                {/* === SECCIÓN 2: DATOS DEL CLIENTE === */}
                {selectedOrderNote?.sale?.client && (
                    <Section title="Datos del Cliente">
                        <Grid container spacing={2}>
                            <Grid xs={12} sm={6}>
                                <TextField
                                    label="Contacto"
                                    value={selectedOrderNote.sale.client.name || ''}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={12} sm={6}>
                                <TextField
                                    label="DNI/CUIT"
                                    value={selectedOrderNote.sale.client.cuit || ''}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={12} sm={4}>
                                <TextField
                                    label="Dirección"
                                    value={selectedOrderNote.sale.client.address || ''}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={12} sm={4}>
                                <TextField
                                    label="Teléfono"
                                    value={selectedOrderNote.sale.client.phone || ''}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={12} sm={4}>
                                <TextField
                                    label="Email"
                                    value={selectedOrderNote.sale.client.email || ''}
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
                            <FormControl fullWidth>
                                <InputLabel>Producto Base</InputLabel>
                                <Select
                                    value={formData.base_product || ''}
                                    label="Producto Base"
                                    name="base_product"
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
                            <FormControl fullWidth>
                                <InputLabel>Escudo</InputLabel>
                                <Select
                                    value={formData.customization_details?.escudo || ''}
                                    label="Escudo"
                                    name="customization_escudo"
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value="Bordado">Bordado</MenuItem>
                                    <MenuItem value="Sublimado">Sublimado</MenuItem>
                                    <MenuItem value="Vinilo">Vinilo</MenuItem>
                                    <MenuItem value="No lleva">No lleva</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Marca</InputLabel>
                                <Select
                                    value={formData.customization_details?.marca || ''}
                                    label="Marca"
                                    name="customization_marca"
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value="Bordado">Bordado</MenuItem>
                                    <MenuItem value="Sublimado">Sublimado</MenuItem>
                                    <MenuItem value="Vinilo">Vinilo</MenuItem>
                                    <MenuItem value="No lleva">No lleva</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Color Tela</InputLabel>
                                <Select
                                    value={formData.customization_details?.color_tela || ''}
                                    label="Color Tela"
                                    name="customization_color_tela"
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
                                <InputLabel>Tela</InputLabel>
                                <Select
                                    value={formData.customization_details?.tela || ''}
                                    label="Tela"
                                    name="customization_tela"
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value="Set de Microfibra">Set de Microfibra</MenuItem>
                                    <MenuItem value="Pique">Pique</MenuItem>
                                    <MenuItem value="Elastano">Elastano</MenuItem>
                                    <MenuItem value="Frisa">Frisa</MenuItem>
                                    <MenuItem value="Algodón">Algodón</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Cuello</InputLabel>
                                <Select
                                    value={formData.customization_details?.cuello || ''}
                                    label="Cuello"
                                    name="customization_cuello"
                                    onChange={handleFormChange}
                                >
                                    <MenuItem value="Redondo">Redondo</MenuItem>
                                    <MenuItem value="Polo">Polo</MenuItem>
                                    <MenuItem value="Escote en V">Escote en V</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Section>
                {/* === SECCIÓN 4: DETALLE DEL PEDIDO === */}
                <Section title="Detalle del Pedido">
                    <TextField
                        label="Detalles Adicionales"
                        name="details"
                        value={formData.details || ''}
                        onChange={handleFormChange}
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Especificaciones especiales, instrucciones de producción, etc."
                    />
                </Section>
                {/* === SECCIÓN 5: PLANTILLA DE TALLES === */}
                <Section title="Plantilla de Talles">
                    <Grid container spacing={2}>
                        <Grid xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Talle</InputLabel>
                                <Select
                                    value={currentItem.size}
                                    label="Talle"
                                    name="size"
                                    onChange={handleCurrentItemChange}
                                    disabled={!selectedBaseProduct}
                                >
                                    {selectedBaseProduct?.sizes?.map((size) => (
                                        <MenuItem key={size.id || size} value={size.name || size}>
                                            {size.name || size}
                                        </MenuItem>
                                    )) || []}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid xs={12} sm={3}>
                            <TextField
                                label="Cantidad"
                                name="quantity"
                                type="number"
                                value={currentItem.quantity}
                                onChange={handleCurrentItemChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid xs={12} sm={3}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={currentItem.is_goalie}
                                        onChange={handleCurrentItemChange}
                                        name="is_goalie"
                                    />
                                }
                                label="Arquero"
                            />
                        </Grid>
                        <Grid xs={12} sm={2}>
                            <Button
                                variant="contained"
                                onClick={handleAddItem}
                                fullWidth
                            >
                                {editingIndex !== null ? 'Actualizar' : 'Agregar'}
                            </Button>
                        </Grid>
                    </Grid>

                    {formData.items && formData.items.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Listado de Talles - Total: {formData.items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0)} prendas
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Talle</TableCell>
                                            <TableCell>Cantidad</TableCell>
                                            <TableCell>Arquero</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.size}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>{item.is_goalie ? 'Sí' : 'No'}</TableCell>
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
                {/* === SECTION 6: ESCUDOS Y SPONSORS === */}
                <Grid xs={12}>
                    <Section title="Escudos y Sponsors">
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                                    Agregar Escudo
                                    <input type="file" hidden multiple onChange={(e) => handleFileChange(e, 'escudo')} ref={escudoInputRef} />
                                </Button>
                                {renderFileList(escudoFiles, 'escudo')}
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                                    Agregar Sponsors
                                    <input type="file" hidden multiple onChange={(e) => handleFileChange(e, 'sponsor')} ref={sponsorInputRef} />
                                </Button>
                                {renderFileList(sponsorFiles, 'sponsor')}
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                                    Agregar Template
                                    <input type="file" hidden multiple onChange={(e) => handleFileChange(e, 'template')} ref={templateInputRef} />
                                </Button>
                                {renderFileList(templateFiles, 'template')}
                            </Grid>
                        </Grid>
                    </Section>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Orden de Producción</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductionOrderFormIndumentaria;