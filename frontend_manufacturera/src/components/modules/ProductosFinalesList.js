import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, CircularProgress, Alert,
    Select, InputLabel, FormControl, Chip, OutlinedInput, MenuItem // Added Select, InputLabel, FormControl, Chip, OutlinedInput, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Color Form Dialog Component (Nested)
const ColorForm = ({ open, onClose, onSave, color }) => {
    const [formData, setFormData] = useState({ name: '', hex_code: '' });

    useEffect(() => {
        if (color) {
            setFormData(color);
        } else {
            setFormData({ name: '', hex_code: '' });
        }
    }, [color, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{color ? 'Editar Color' : 'Nuevo Color'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre del Color" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="hex_code" label="Código Hexadecimal (ej: #FFFFFF)" type="text" fullWidth value={formData.hex_code || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};


// Product Form Dialog Component
const ProductForm = ({ open, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        factory_price: '',
        club_price: '',
        suggested_final_price: '',
        cost: '',
        sku: '',
        weight: '',
        waste: '',
        is_manufactured: true,
        design: '', // Added design field
        colors: [], // Changed from color to colors (array of IDs)
    });
    const [productFiles, setProductFiles] = useState([]);
    const [designs, setDesigns] = useState([]); // To fetch designs
    const [sizes, setSizes] = useState([]); // To fetch sizes
    const [availableSizes, setAvailableSizes] = useState([]); // To fetch sizes
    const [availableColors, setAvailableColors] = useState([]); // To fetch colors
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [dependenciesError, setDependenciesError] = useState(null);
    const { tenantId } = useAuth();

    const [isColorFormOpen, setIsColorFormOpen] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null);

    const handleOpenColorForm = (color = null) => {
        setSelectedColor(color);
        setIsColorFormOpen(true);
    };

    const handleCloseColorForm = () => {
        setSelectedColor(null);
        setIsColorFormOpen(false);
    };

    const handleSaveColor = async (colorData) => {
        try {
            if (selectedColor) {
                await api.update('/colors/', selectedColor.id, colorData);
            } else {
                await api.create('/colors/', colorData);
            }
            handleCloseColorForm();
            // Re-fetch colors after saving
            const colorsData = await api.list('/colors/');
            setAvailableColors(Array.isArray(colorsData) ? colorsData : colorsData.results || []);
        } catch (err) {
            console.error('Error al guardar el color:', err);
            // Optionally, set an error state to display to the user
        }
    };

    const handleFileChange = (e) => {
        setProductFiles([...productFiles, ...e.target.files]);
    };

    const handleDeleteFile = (fileIndex) => {
        const newFiles = [...productFiles];
        newFiles.splice(fileIndex, 1);
        setProductFiles(newFiles);
    };

    const handleDeleteExistingProductFile = async (fileId) => {
        if (window.confirm('¿Está seguro de que desea eliminar este archivo?')) {
            try {
                await api.remove('/product-files/', fileId);
                onSave(null, true); // Special call to onSave to just refresh the data
            } catch (err) {
                console.error('Error deleting file:', err);
            }
        }
    };

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [designsData, sizesData, colorsData] = await Promise.all([
                    api.list('/plantillas/'), // Fetch designs (plantillas)
                    api.list('/sizes/'), // Fetch sizes
                    api.list('/colors/'), // Fetch colors
                ]);
                setDesigns(Array.isArray(designsData) ? designsData : designsData.results || []);
                setSizes(Array.isArray(sizesData) ? sizesData : sizesData.results || []);
                setAvailableColors(Array.isArray(colorsData) ? colorsData : colorsData.results || []);
            } catch (err) {
                setDependenciesError('Error al cargar dependencias (plantillas, tallas, colores).');
                console.error(err);
            } finally {
                setLoadingDependencies(false);
            }
        };

        if (tenantId) {
            fetchDependencies();
        }
    }, [tenantId]);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                factory_price: product.factory_price || '',
                club_price: product.club_price || '',
                suggested_final_price: product.suggested_final_price || '',
                cost: product.cost || '',
                sku: product.sku || '',
                weight: product.weight || '',
                waste: product.waste || '',
                is_manufactured: product.is_manufactured || false,
                design: product.design?.id || '', // ← CORREGIDO: Obtener el ID del objeto design
                colors: product.colors ? product.colors.map(c => c.id) : [],
            });
            setProductFiles(product.product_files || []);
        } else {
            setFormData({
                name: '',
                description: '',
                factory_price: '',
                club_price: '',
                suggested_final_price: '',
                cost: '',
                sku: '',
                weight: '',
                waste: '',
                is_manufactured: true,
                design: '',
                colors: [],
            });
            setAvailableSizes([]);
            setProductFiles([]);
        }
    }, [product, open]);

    useEffect(() => {
        if (formData.design) {
            const selectedDesign = designs.find(d => d.id === formData.design);
            if (selectedDesign) {
                setFormData(prev => ({ ...prev, cost: selectedDesign.calculated_cost }));
                setAvailableSizes(selectedDesign.sizes || []);
            }
        } else {
            setAvailableSizes([]);
        }
    }, [formData.design, designs]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleMultiSelectChange = (event) => {
        const {
            target: { value },
        } = event;
        setFormData({
            ...formData,
            colors: typeof value === 'string' ? value.split(',') : value,
        });
    };

    const handleSubmit = () => {
        const submissionData = new FormData();
        submissionData.append('name', formData.name);
        submissionData.append('description', formData.description);
        submissionData.append('factory_price', formData.factory_price);
        submissionData.append('club_price', formData.club_price);
        submissionData.append('suggested_final_price', formData.suggested_final_price);
        
        submissionData.append('sku', formData.sku);
        submissionData.append('weight', formData.weight);
        submissionData.append('waste', formData.waste);
        submissionData.append('is_manufactured', formData.is_manufactured);
        if (formData.design) {
            submissionData.append('design_id', formData.design);
        }
        formData.colors.forEach(id => submissionData.append('color_ids', id));

        productFiles.forEach(file => {
            submissionData.append('product_files', file);
        });

        console.log('=== DEBUG GUARDAR PRODUCTO ===');
        console.log('formData.design:', formData.design);
        console.log('FormData entries:');
        for (let pair of submissionData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        console.log('==============================');


        onSave(submissionData);
    };

    if (loadingDependencies) {
        return (
            <Dialog open={open} onClose={onClose}><DialogTitle>Cargando...</DialogTitle><DialogContent><CircularProgress /></DialogContent></Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{product ? 'Editar Producto Final' : 'Nuevo Producto Final'}</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Plantilla de Producto</InputLabel>
                    <Select
                        name="design"
                        value={formData.design || ''}
                        onChange={handleChange}
                        label="Plantilla de Producto"
                    >
                        <MenuItem value=""><em>Ninguna</em></MenuItem>
                        {designs.map((design) => (
                            <MenuItem key={design.id} value={design.id}>{design.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField autoFocus margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth value={formData.description || ''} onChange={handleChange} />
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Talles Disponibles:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    {availableSizes.length > 0 ? availableSizes.map(size => size.name).join(', ') : ''}
                </Typography>

                {product && formData.design && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        La plantilla no puede modificarse una vez creado el producto
                    </Typography>
                )}
                <Button onClick={() => handleOpenColorForm()} sx={{ mt: 1, mb: 2 }}>
                    Nuevo Color
                </Button>
                <TextField margin="dense" name="sku" label="SKU" type="text" fullWidth value={formData.sku || ''} onChange={handleChange} />
                <TextField margin="dense" name="weight" label="Peso" type="number" fullWidth value={formData.weight || ''} onChange={handleChange} />
                <TextField margin="dense" name="waste" label="Desperdicio" type="number" fullWidth value={formData.waste || ''} onChange={handleChange} />
                <Typography sx={{ mt: 2, mb: 1 }}>Archivos (PDF, JPG, PNG)</Typography>
                <TextField
                    type="file"
                    fullWidth
                    onChange={handleFileChange}
                    inputProps={{ accept: ".pdf,.jpg,.png", multiple: true }}
                />
                {product?.product_files && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>Archivos actuales:</Typography>
                        {product.product_files.map(file => (
                            <Typography variant="body2" key={file.id}>
                                <a href={file.file} target="_blank" rel="noopener noreferrer">
                                    {file.file.split("/").pop()}
                                </a>
                                <IconButton onClick={() => handleDeleteExistingProductFile(file.id)} size="small">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Typography>
                        ))}
                    </Box>
                )}
                {productFiles.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>Archivos seleccionados:</Typography>
                        {Array.from(productFiles).map((file, index) => (
                            <Typography variant="body2" key={index}>
                                {file.name}
                                <IconButton onClick={() => handleDeleteFile(index)} size="small">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Typography>
                        ))}
                    </Box>
                )}
                <TextField margin="dense" name="cost" label="Costo" type="number" fullWidth value={formData.cost || ''} InputProps={{ readOnly: true }} onChange={handleChange} />
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Precios</Typography>
                <TextField margin="dense" name="factory_price" label="Fábrica" type="number" fullWidth value={formData.factory_price || ''} onChange={handleChange} />
                <TextField margin="dense" name="club_price" label="Clubes" type="number" fullWidth value={formData.club_price || ''} onChange={handleChange} />
                <TextField margin="dense" name="suggested_final_price" label="Final Sugerido" type="number" fullWidth value={formData.suggested_final_price || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>

            {isColorFormOpen && <ColorForm
                open={isColorFormOpen}
                onClose={handleCloseColorForm}
                onSave={handleSaveColor}
                color={selectedColor}
            />}
        </Dialog>
    );
};


// Main Final Product Management Component
const ProductosFinalesList = () => {
    const { tenantId } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await api.list('/products/');
            const productList = Array.isArray(data) ? data : data.results;
            setProducts(productList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los productos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchProducts();
        }
    }, [tenantId]);

    const handleOpenForm = (product = null) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedProduct(null);
        setIsFormOpen(false);
    };

    const handleSave = async (productData, refresh = false) => {
        if (refresh) {
            fetchProducts();
            handleCloseForm();
            return;
        }
        try {
            if (selectedProduct) {
                await api.patch('/products/', selectedProduct.id, productData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                await api.create('/products/', productData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }
            fetchProducts();
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el producto.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
            try {
                await api.remove('/products/', id);
                fetchProducts();
            } catch (err) {
                setError('Error al eliminar el producto.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button variant="contained" onClick={() => handleOpenForm()} startIcon={<AddIcon />}>
                    Nuevo Producto Final
                </Button>
            </Box>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Precio Fábrica</TableCell>
                                <TableCell>Precio Clubes</TableCell>
                                <TableCell>Precio Final Sugerido</TableCell>
                                <TableCell>Costo</TableCell>
                                <TableCell>SKU</TableCell>
                                
                                <TableCell>Colores</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.description}</TableCell>
                                    <TableCell>{product.factory_price}</TableCell>
                                    <TableCell>{product.club_price}</TableCell>
                                    <TableCell>{product.suggested_final_price}</TableCell>
                                    <TableCell>{product.cost}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    
                                    <TableCell>{product.colors?.map(c => c.name).join(', ')}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(product)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(product.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ProductForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSave}
                product={selectedProduct}
            />
        </Box>
    );
};

export default ProductosFinalesList;