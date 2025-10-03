import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, CircularProgress, Alert,
    MenuItem, Select, InputLabel, FormControl, Grid, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Product Form Dialog Component
const ProductForm = ({ open, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({ name: '', product_code: '', description: '', materials: [], processes: [], category: '', sizes: [] });
    const [designFiles, setDesignFiles] = useState([]);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [rawMaterialsWithCost, setRawMaterialsWithCost] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [dependenciesError, setDependenciesError] = useState(null);
    const { tenantId } = useAuth();

    const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isSizeFormOpen, setIsSizeFormOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);

    const handleOpenCategoryForm = (category = null) => {
        setSelectedCategory(category);
        setIsCategoryFormOpen(true);
    };

    const handleCloseCategoryForm = () => {
        setSelectedCategory(null);
        setIsCategoryFormOpen(false);
    };

    const handleFileChange = (e) => {
        setDesignFiles([...designFiles, ...e.target.files]);
    };

    const handleDeleteFile = (fileIndex) => {
        const newFiles = [...designFiles];
        newFiles.splice(fileIndex, 1);
        setDesignFiles(newFiles);
    };

    const handleDeleteExistingFile = async (fileId) => {
        if (window.confirm('¿Está seguro de que desea eliminar este archivo?')) {
            try {
                await api.remove('/design-files/', fileId);
                onSave(null, true);
            } catch (err) {
                console.error('Error deleting file:', err);
            }
        }
    };

    const handleSaveCategory = async (categoryData) => {
        try {
            if (selectedCategory) {
                await api.update('/categories/', selectedCategory.id, categoryData);
            } else {
                await api.create('/categories/', categoryData);
            }
            handleCloseCategoryForm();
            const categoriesData = await api.list('/categories/');
            setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.results || []);
        } catch (err) {
            console.error('Error al guardar la categoría:', err);
        }
    };

    const handleOpenSizeForm = (size = null) => {
        setSelectedSize(size);
        setIsSizeFormOpen(true);
    };

    const handleCloseSizeForm = () => {
        setSelectedSize(null);
        setIsSizeFormOpen(false);
    };

    const handleSaveSize = async (sizeData) => {
        try {
            if (selectedSize) {
                await api.update('/sizes/', selectedSize.id, sizeData);
            } else {
                await api.create('/sizes/', sizeData);
            }
            handleCloseSizeForm();
            const sizesData = await api.list('/sizes/');
            setSizes(Array.isArray(sizesData) ? sizesData : sizesData.results || []);
        } catch (err) {
            console.error('Error al guardar la talla:', err);
        }
    };

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [rawMaterialsData, rawMaterialsProveedorData, processesData, categoriesData, sizesData] = await Promise.all([
                    api.list('/raw-materials/'),
                    api.list('/materia-prima-proveedores/'),
                    api.list('/processes/'),
                    api.list('/categories/'),
                    api.list('/sizes/'),
                ]);
                
                setRawMaterials(Array.isArray(rawMaterialsData) ? rawMaterialsData : rawMaterialsData.results || []);
                
                const materialsWithCost = Array.isArray(rawMaterialsProveedorData) ? rawMaterialsProveedorData : rawMaterialsProveedorData.results || [];
                setRawMaterialsWithCost(materialsWithCost);
                
                console.log('Fetched rawMaterialsData:', rawMaterialsData);
                console.log('Fetched rawMaterialsProveedorData with costs:', materialsWithCost);
                
                setProcesses(Array.isArray(processesData) ? processesData : processesData.results || []);
                setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.results || []);
                console.log('Fetched categoriesData:', categoriesData);
                console.log('Categories state after setting:', (Array.isArray(categoriesData) ? categoriesData : categoriesData.results || []));
                setSizes(Array.isArray(sizesData) ? sizesData : sizesData.results || []);
            } catch (err) {
                setDependenciesError('Error al cargar dependencias (materias primas, procesos, categorías, tallas).');
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
            const transformedMaterials = product.materials?.map(m => ({
                ...m,
                unit_cost: m.cost,
                raw_material_cost: (parseFloat(m.cost) * parseFloat(m.quantity)).toFixed(2),
            })) || [];

            const transformedProcesses = product.processes?.map(p => ({
                ...p,
                process_cost: p.cost || 0,
            })) || [];
            setDesignFiles([]);
            setFormData({
                name: product.name || '',
                product_code: product.product_code || '',
                description: product.description || '',
                materials: transformedMaterials,
                processes: transformedProcesses,
                category: product.category ? product.category.id : '',
                sizes: product.sizes ? product.sizes.map(s => s.id) : [],
            });
        } else {
            setFormData({ name: '', product_code: '', description: '', materials: [], processes: [], category: '', sizes: [] });
            setDesignFiles([]);
        }
    }, [product, open]);

    useEffect(() => {
        let materialCost = 0;
        formData.materials.forEach(material => {
            materialCost += parseFloat(material.raw_material_cost || 0);
        });

        let processCost = 0;
        formData.processes.forEach(proc => {
            processCost += parseFloat(proc.process_cost || 0);
        });

        setEstimatedCost(materialCost + processCost);
    }, [formData.materials, formData.processes]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSizeButtonClick = (sizeId) => {
        setFormData(prev => {
            const currentSizes = prev.sizes;
            if (currentSizes.includes(sizeId)) {
                return { ...prev, sizes: currentSizes.filter(id => id !== sizeId) };
            } else {
                return { ...prev, sizes: [...currentSizes, sizeId] };
            }
        });
    };

    const handleRecipeChange = (type, index, field, value) => {
        const newItems = [...formData[type]];
        newItems[index][field] = value;
 
        if (type === 'materials') {
            const material = newItems[index];
            if (field === 'raw_material' || field === 'quantity') {
                const selectedRawMaterial = rawMaterials.find(rm => rm.id === material.raw_material);
                
                if (selectedRawMaterial && material.quantity) {
                    const materialsFromProviders = rawMaterialsWithCost.filter(
                        mp => mp.raw_material === selectedRawMaterial.id
                    );
                    
                    let highestCost = 0;
                    
                    if (materialsFromProviders.length > 0) {
                        highestCost = Math.max(...materialsFromProviders.map(mp => parseFloat(mp.cost || 0)));
                        console.log(`Material: ${selectedRawMaterial.name}, Highest Cost: ${highestCost}, Quantity: ${material.quantity}`);
                    } else {
                        console.warn(`No se encontraron costos para la materia prima: ${selectedRawMaterial.name}`);
                    }

                    newItems[index].unit_cost = highestCost;
                    newItems[index].raw_material_cost = (highestCost * parseFloat(material.quantity)).toFixed(2);
                    
                    console.log(`Calculated cost for ${selectedRawMaterial.name}: ${newItems[index].raw_material_cost}`);
                } else {
                    newItems[index].unit_cost = 0;
                    newItems[index].raw_material_cost = '0.00';
                }
            }
        } else if (type === 'processes') {
            if (field === 'process') {
                const selectedProcess = processes.find(p => p.id === value);
                if (selectedProcess) {
                    newItems[index].process_cost = selectedProcess.cost;
                }
            }
        }
 
        setFormData(prev => ({ ...prev, [type]: newItems }));
    };

    const addRecipeItem = (type) => {
        const newItem = type === 'materials'
            ? { raw_material: '', quantity: '', process: '', raw_material_cost: 0, unit_cost: 0 }
            : { process: '', order: formData.processes.length + 1, process_cost: 0 };
        setFormData(prev => ({ ...prev, [type]: [...prev[type], newItem] }));
    };

    const removeRecipeItem = (type, index) => {
        const newItems = formData[type].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [type]: newItems }));
    };

    const handleSubmit = () => {
        const submissionData = new FormData();

        submissionData.append('name', formData.name);
        submissionData.append('product_code', formData.product_code);
        submissionData.append('description', formData.description);
        submissionData.append('category_id', formData.category);

        designFiles.forEach(file => {
            submissionData.append('design_files', file);
        });

        formData.materials.forEach((m, index) => {
            submissionData.append(`materials[${index}]id`, m.id || '');
            submissionData.append(`materials[${index}]raw_material`, m.raw_material);
            submissionData.append(`materials[${index}]quantity`, parseFloat(m.quantity));
            submissionData.append(`materials[${index}]cost`, parseFloat(m.unit_cost));
            if (m.process) {
                submissionData.append(`materials[${index}]process`, m.process);
            }
        });

        formData.processes.forEach((p, index) => {
            submissionData.append(`processes[${index}]id`, p.id || '');
            submissionData.append(`processes[${index}]process`, p.process);
            submissionData.append(`processes[${index}]order`, p.order);
            submissionData.append(`processes[${index}]cost`, parseFloat(p.process_cost));
        });

        formData.sizes.forEach((sizeId, index) => {
            submissionData.append(`size_ids[${index}]`, sizeId);
        });

        onSave(submissionData);
    };

    const CategoryForm = ({ open, onClose, onSave, category }) => {
        const [formData, setFormData] = useState({ name: '' });

        useEffect(() => {
            if (category) {
                setFormData({ name: category.name || '' });
            } else {
                setFormData({ name: '' });
            }
        }, [category, open]);

        const handleFormChange = (e) => {
            setFormData(prev => ({ ...prev, name: e.target.value }));
        };

        const handleSubmit = () => {
            onSave(formData);
        };

        return (
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
                <DialogTitle>{category ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" name="name" label="Nombre de la Categoría" type="text" fullWidth value={formData.name} onChange={handleFormChange} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Guardar</Button>
                </DialogActions>
            </Dialog>
        );
    };

    const SizeForm = ({ open, onClose, onSave, size }) => {
        const [formData, setFormData] = useState({ name: '', cost_percentage_increase: 0.00 });

        useEffect(() => {
            if (size) {
                setFormData({
                    name: size.name || '',
                    cost_percentage_increase: size.cost_percentage_increase || 0.00
                });
            } else {
                setFormData({ name: '', cost_percentage_increase: 0.00 });
            }
        }, [size, open]);

        const handleFormChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = () => {
            onSave(formData);
        };

        return (
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
                <DialogTitle>{size ? 'Editar Talla' : 'Nueva Talla'}</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" name="name" label="Nombre de la Talla" type="text" fullWidth value={formData.name} onChange={handleFormChange} />
                    <TextField margin="dense" name="cost_percentage_increase" label="Porcentaje de Incremento de Costo" type="number" fullWidth value={formData.cost_percentage_increase} onChange={handleFormChange} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Guardar</Button>
                </DialogActions>
            </Dialog>
        );
    };

    if (loadingDependencies) {
        return (
            <Dialog open={open} onClose={onClose}><DialogTitle>Cargando...</DialogTitle><DialogContent><CircularProgress /></DialogContent></Dialog>
        );
    }

    if (dependenciesError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    <Alert severity="error">{dependenciesError}</Alert>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>{product ? 'Editar Plantilla de Producto' : 'Nueva Plantilla de Producto'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name} onChange={handleFormChange} />
                <TextField margin="dense" name="product_code" label="Código de Producto" type="text" fullWidth value={formData.product_code} onChange={handleFormChange} />
                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth multiline rows={3} value={formData.description} onChange={handleFormChange} />

                <Typography sx={{ mt: 2, mb: 1 }}>Moldería (PDF)</Typography>
                <TextField
                    type="file"
                    fullWidth
                    onChange={handleFileChange}
                    inputProps={{ accept: ".pdf", multiple: true }}
                />
                {product?.design_files && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>Archivos actuales:</Typography>
                        {product.design_files.map(file => (
                            <Typography variant="body2" key={file.id}>
                                <a href={file.file} target="_blank" rel="noopener noreferrer">
                                    {file.file.split("/").pop()}
                                </a>
                                <IconButton onClick={() => handleDeleteExistingFile(file.id)} size="small">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Typography>
                        ))}
                    </Box>
                )}
                {designFiles.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>Archivos seleccionados:</Typography>
                        {Array.from(designFiles).map((file, index) => (
                            <Typography variant="body2" key={index}>
                                {file.name}
                                <IconButton onClick={() => handleDeleteFile(index)} size="small">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Typography>
                        ))}
                    </Box>
                )}

                <FormControl fullWidth margin="dense">
                    <InputLabel id="category-label">Categoría</InputLabel>
                    <Select
                        labelId="category-label"
                        name="category"
                        value={formData.category}
                        label="Categoría"
                        onChange={handleFormChange}
                    >
                        {categories.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button onClick={() => handleOpenCategoryForm()} sx={{ mt: 1, mb: 2 }}>
                    Nueva Categoría
                </Button>

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Tallas</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {sizes.map(size => (
                        <Button
                            key={size.id}
                            variant={formData.sizes.includes(size.id) ? 'contained' : 'outlined'}
                            onClick={() => handleSizeButtonClick(size.id)}
                        >
                            {size.name}
                        </Button>
                    ))}
                </Box>
                <Button onClick={() => handleOpenSizeForm()} sx={{ mt: 1, mb: 2 }}>
                    Nueva Talla
                </Button>

                <Typography sx={{ mt: 2, mb: 1 }}>Receta de Materiales</Typography>
                <Stack spacing={2}>
                    {formData.materials.map((material, index) => (
                        <Grid container spacing={1} key={index} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                <FormControl fullWidth sx={{ minWidth: 200 }}>
                                    <InputLabel>Materia Prima</InputLabel>
                                    <Select value={material.raw_material} onChange={(e) => handleRecipeChange('materials', index, 'raw_material', e.target.value)}>
                                        {rawMaterials.map(rm => <MenuItem key={rm.id} value={rm.id}>{rm.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <FormControl fullWidth sx={{ minWidth: 200 }}>
                                    <InputLabel>Proceso</InputLabel>
                                    <Select value={material.process || ''} onChange={(e) => handleRecipeChange('materials', index, 'process', e.target.value)}>
                                        <MenuItem value=""><em>Ninguno</em></MenuItem>
                                        {formData.processes.map(p => {
                                            const process = processes.find(proc => proc.id === p.process);
                                            return process ? <MenuItem key={process.id} value={process.id}>{process.name}</MenuItem> : null;
                                        })}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <TextField label="Cantidad" type="number" fullWidth value={material.quantity} onChange={(e) => handleRecipeChange('materials', index, 'quantity', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <TextField label="Costo Total" type="text" fullWidth value={material.raw_material_cost} InputProps={{ readOnly: true }} />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <IconButton onClick={() => removeRecipeItem('materials', index)}><DeleteIcon /></IconButton>
                            </Grid>
                        </Grid>
                    ))}
                </Stack>
                <Button startIcon={<AddIcon />} onClick={() => addRecipeItem('materials')} sx={{ mt: 1 }}>Añadir Materia Prima</Button>

                <Typography sx={{ mt: 3, mb: 1 }}>Secuencia de Procesos</Typography>
                <Stack spacing={2}>
                    {formData.processes.map((proc, index) => (
                        <Grid container spacing={2} key={index} alignItems="center">
                            <Grid item xs={4}>
                                <FormControl fullWidth sx={{ minWidth: 200 }}>
                                    <InputLabel>Proceso</InputLabel>
                                    <Select value={proc.process} onChange={(e) => handleRecipeChange('processes', index, 'process', e.target.value)}>
                                        {processes.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                                <TextField label="Orden" type="number" fullWidth value={proc.order} onChange={(e) => handleRecipeChange('processes', index, 'order', e.target.value)} />
                            </Grid>
                            <Grid item xs={3}>
                                <TextField label="Costo" type="text" fullWidth value={proc.process_cost} onChange={(e) => handleRecipeChange('processes', index, 'process_cost', e.target.value)} />
                            </Grid>
                            <Grid item xs={2}>
                                <IconButton onClick={() => removeRecipeItem('processes', index)}><DeleteIcon /></IconButton>
                            </Grid>
                        </Grid>
                    ))}
                </Stack>
                <Button startIcon={<AddIcon />} onClick={() => addRecipeItem('processes')} sx={{ mt: 1 }}>Añadir Proceso</Button>

                <TextField
                    margin="dense"
                    label="Costo Estimado"
                    type="number"
                    fullWidth
                    value={estimatedCost.toFixed(2)}
                    InputProps={{ readOnly: true }}
                    sx={{ mt: 2, mb: 2 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>

            {isCategoryFormOpen && <CategoryForm
                open={isCategoryFormOpen}
                onClose={handleCloseCategoryForm}
                onSave={handleSaveCategory}
                category={selectedCategory}
            />}

            {isSizeFormOpen && <SizeForm
                open={isSizeFormOpen}
                onClose={handleCloseSizeForm}
                onSave={handleSaveSize}
                size={selectedSize}
            />}
        </Dialog>
    );
};

const PlantillasProductoList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const { tenantId } = useAuth();

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await api.list('/plantillas/');
            setProducts(data.results || (Array.isArray(data) ? data : []));
            setError(null);
        } catch (err) {
            setError('Error al cargar las plantillas de producto.');
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
                await api.patch('/plantillas/', selectedProduct.id, productData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                await api.create('/plantillas/', productData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }
            fetchProducts();
            handleCloseForm();
        } catch (err) {
            console.error("Error saving product template:", err);
            console.error("Validation errors:", err.response?.data);
            const errorData = err.response?.data;
            const errorMessage = errorData ? JSON.stringify(errorData) : 'Error al guardar la plantilla de producto.';
            setError(errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta plantilla de producto?')) {
            try {
                await api.remove('/plantillas/', id);
                fetchProducts();
            } catch (err) {
                setError('Error al eliminar la plantilla de producto.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Plantilla de Producto
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Código de Producto</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Materiales</TableCell>
                                <TableCell>Procesos</TableCell>
                                <TableCell>Costo Calculado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.product_code}</TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.description}</TableCell>
                                    <TableCell>
                                        {product.materials?.map(m => `${m.raw_material_name} (${m.quantity})`).join(', ')}
                                    </TableCell>
                                    <TableCell>
                                        {product.processes?.sort((a, b) => a.order - b.order).map(p => `${p.order}. ${p.process_name}`).join(', ')}
                                    </TableCell>
                                    <TableCell>{product.calculated_cost}</TableCell>
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

            {isFormOpen && <ProductForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSave}
                product={selectedProduct}
            />}
        </Box>
    );
};

export default PlantillasProductoList;
