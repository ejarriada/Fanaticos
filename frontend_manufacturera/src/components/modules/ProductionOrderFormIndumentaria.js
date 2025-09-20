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

    const selectedOrderNote = orderNotes.find(on => on.id === formData.order_note_id);
    const selectedBaseProduct = products.find(p => p.id === formData.base_product_id);

    useEffect(() => {
        if (!open) return;
        
        const initializeForm = async () => {
            setLoading(true);
            try {
                const colorsPromise = api.list('/colors/');
                const productsPromise = api.list('/products/?is_manufactured=true');
                const notesPromise = api.list('/order-notes/?status=Pendiente');

                const [productsData, notesData, colorsData] = await Promise.all([productsPromise, notesPromise, colorsPromise]);
                
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
                        order_note_id: order.order_note?.id || '',
                        base_product_id: order.base_product?.id || '',
                        items: order.items || [],
                        customization_details: order.customization_details || {},
                    });
                    // Note: Existing files are not handled in this edit view yet.
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
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>{order ? 'Editar' : 'Nueva'} Orden de Producción de Indumentaria</DialogTitle>
            <DialogContent>
                {/* ... Sections 1, 2, 3, 4 ... */}
                {/* === SECTION 6: ESCUDOS Y SPONSORS === */}
                <Grid item xs={12}>
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