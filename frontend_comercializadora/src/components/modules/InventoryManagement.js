import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem,
    Tabs, Tab, AppBar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import StockAdjustmentDialog from './StockAdjustmentDialog';

import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Product Form Dialog Component (Copied from ProductManagement.js)
const ProductForm = ({ open, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (product) {
            setFormData(product);
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                cost: '',
                sku: '',
                is_manufactured: false, // Default to false for manually created products
            });
        }
    }, [product, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{product ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth value={formData.description || ''} onChange={handleChange} />
                <TextField margin="dense" name="price" label="Precio" type="number" fullWidth value={formData.price || ''} onChange={handleChange} />
                <TextField margin="dense" name="cost" label="Costo" type="number" fullWidth value={formData.cost || ''} onChange={handleChange} />
                <TextField margin="dense" name="sku" label="SKU" type="text" fullWidth value={formData.sku || ''} onChange={handleChange} />
                {product && product.is_manufactured && (
                    <TextField
                        margin="dense"
                        name="is_manufactured"
                        label="Producto de Manufactura"
                        type="text"
                        fullWidth
                        value={formData.is_manufactured ? 'Sí' : 'No'}
                        InputProps={{ readOnly: true }}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

import CommercialInventoryForm from './CommercialInventoryForm';
const InventoryForm = ({ open, onClose, onSave, inventory }) => {
    const [formData, setFormData] = useState({});
    const [products, setProducts] = useState([]);
    const [locals, setLocals] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [dependenciesError, setDependenciesError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [productsData, localsData] = await Promise.all([
                    api.list('commercial/commercial-products/'),
                    api.list('/locals/'),
                ]);
                setProducts(Array.isArray(productsData) ? productsData : productsData.results || []);
                setLocals(Array.isArray(localsData) ? localsData : localsData.results || []);
            } catch (err) {
                setDependenciesError('Error al cargar dependencias (productos, locales).');
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
        if (inventory) {
            setFormData({
                ...inventory,
                product: inventory.product?.id || '',
                local: inventory.local?.id || '',
            });
        } else {
            setFormData({
                product: '',
                local: '',
                quantity: ''
            });
        }
    }, [inventory, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingDependencies) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (dependenciesError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">{dependenciesError}</Alert></DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{inventory ? 'Editar Inventario' : 'Nuevo Inventario'}</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    name="product"
                    label="Producto"
                    select
                    fullWidth
                    value={formData.product || ''}
                    onChange={handleChange}
                >
                    {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                            {product.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    name="local"
                    label="Local"
                    select
                    fullWidth
                    value={formData.local || ''}
                    onChange={handleChange}
                >
                    {locals.map((local) => (
                        <MenuItem key={local.id} value={local.id}>
                            {local.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="quantity" label="Cantidad" type="number" fullWidth value={formData.quantity || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// TabPanel component for conditional rendering
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Main Inventory Management Component
const InventoryManagement = () => {
    const { tenantId } = useAuth();
    const [tabValue, setTabValue] = useState(0); // State for tab selection

    // Inventory Management States and Functions
    const [inventories, setInventories] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(true);
    const [inventoryError, setInventoryError] = useState(null);
    const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
    const [selectedInventory, setSelectedInventory] = useState(null);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [refreshInventoryKey, setRefreshInventoryKey] = useState(0); // Key to trigger data refresh

    // Product Management States and Functions (Copied from ProductManagement.js)
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productError, setProductError] = useState(null);
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    // Handle Tab Change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Inventory Management Functions
    const fetchInventories = async () => {
        try {
            setLoadingInventory(true);
            const data = await api.list('commercial/commercial-inventories/');
            const inventoryList = Array.isArray(data) ? data : data.results;
            setInventories(inventoryList || []);
            setInventoryError(null);
        } catch (err) {
            setInventoryError('Error al cargar el inventario. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoadingInventory(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchInventories();
        }
    }, [tenantId, refreshInventoryKey]);

    const handleOpenInventoryForm = (inventory = null) => {
        setSelectedInventory(inventory);
        setIsInventoryFormOpen(true);
    };

    const handleCloseInventoryForm = () => {
        setSelectedInventory(null);
        setIsInventoryFormOpen(false);
    };

    const handleOpenAdjustmentDialog = (item) => {
        setSelectedItem(item);
        setIsAdjustmentOpen(true);
    };

    const handleCloseAdjustmentDialog = () => {
        setSelectedItem(null);
        setIsAdjustmentOpen(false);
    };

    const handleSaveAdjustment = async (adjustmentData) => {
        try {
            await api.create('/stock-adjustments/', adjustmentData);
            handleCloseAdjustmentDialog();
            fetchInventories(); // Refresh list after adjustment
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el ajuste de stock.';
            setInventoryError(errorMessage); // Display error to the user
            console.error(err);
        }
    };

    const handleSaveInventory = async (inventoryData) => {
        try {
            const dataToSend = {
                ...inventoryData,
                product: inventoryData.product || null,
                local: inventoryData.local || null,
            };

            if (selectedInventory) {
                await api.update('commercial/commercial-inventories/', selectedInventory.id, dataToSend);
            } else {
                await api.create('commercial/commercial-inventories/', dataToSend);
            }
            fetchInventories(); // Refresh list
            handleCloseInventoryForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el inventario.';
            setInventoryError(errorMessage);
            console.error(err);
        }
    };

    const handleDeleteInventory = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este elemento del inventario?')) {
            try {
                await api.remove('commercial/commercial-inventories/', id);
                fetchInventories(); // Refresh list
            } catch (err) {
                setInventoryError('Error al eliminar el inventario.');
                console.error(err);
            }
        }
    };

    // Product Management Functions (Copied from ProductManagement.js)
    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const data = await api.list('commercial/commercial-products/');
            const productList = Array.isArray(data) ? data : data.results;
            setProducts(productList || []);
            setProductError(null);
        } catch (err) {
            setProductError('Error al cargar los productos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        if (tenantId && tabValue === 1) { // Fetch products only when product tab is active
            fetchProducts();
        }
    }, [tenantId, tabValue]);

    const handleOpenProductForm = (product = null) => {
        setSelectedProduct(product);
        setIsProductFormOpen(true);
    };

    const handleCloseProductForm = () => {
        setSelectedProduct(null);
        setIsProductFormOpen(false);
    };

    const handleSaveProduct = async (productData) => {
        try {
            if (selectedProduct) {
                await api.update('commercial/commercial-products/', selectedProduct.id, productData);
            } else {
                await api.create('commercial/commercial-products/', productData);
            }
            fetchProducts(); // Refresh list
            handleCloseProductForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el producto.';
            setProductError(errorMessage);
            console.error(err);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
            try {
                await api.remove('commercial/commercial-products/', id);
                fetchProducts(); // Refresh list
            } catch (err) {
                setProductError('Error al eliminar el producto.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ width: '100%', typography: 'body1' }}>
            <AppBar position="static">
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="inventory and product tabs">
                    <Tab label="Gestión de Inventario" />
                    <Tab label="Gestión de Productos" />
                </Tabs>
            </AppBar>

            <TabPanel value={tabValue} index={0}>
                <Typography variant="h4" gutterBottom>Gestión de Inventario</Typography>
                <Button variant="contained" onClick={() => handleOpenInventoryForm()} sx={{ mb: 2 }}>
                    Nuevo Elemento de Inventario
                </Button>

                {loadingInventory && <CircularProgress />}
                {inventoryError && <Alert severity="error">{inventoryError}</Alert>}

                {!loadingInventory && !inventoryError && (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Local</TableCell>
                                    <TableCell>Cantidad</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {inventories.map((inventory) => (
                                    <TableRow key={inventory.id}>
                                        <TableCell>{inventory.product_name || inventory.product}</TableCell>
                                        <TableCell>{inventory.local_name || inventory.local}</TableCell>
                                        <TableCell>{inventory.quantity}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleOpenInventoryForm(inventory)}><EditIcon /></IconButton>
                                            <IconButton onClick={() => handleDeleteInventory(inventory.id)}><DeleteIcon /></IconButton>
                                            <IconButton onClick={() => handleOpenAdjustmentDialog(inventory)} title="Ajustar Stock">
                                                <TuneIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <InventoryForm
                    open={isInventoryFormOpen}
                    onClose={handleCloseInventoryForm}
                    onSave={handleSaveInventory}
                    inventory={selectedInventory}
                />

                <StockAdjustmentDialog
                    open={isAdjustmentOpen}
                    onClose={handleCloseAdjustmentDialog}
                    onSave={handleSaveAdjustment}
                    item={selectedItem}
                />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Typography variant="h4" gutterBottom>Gestión de Productos</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button variant="contained" onClick={() => handleOpenProductForm()} startIcon={<AddIcon />}>
                        Nuevo Producto
                    </Button>
                    <Button variant="outlined" onClick={() => setIsImportDialogOpen(true)}>
                        Importar Productos de Manufactura
                    </Button>
                </Box>

                {loadingProducts && <CircularProgress />}
                {productError && <Alert severity="error">{productError}</Alert>}

                {!loadingProducts && !productError && (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Descripción</TableCell>
                                    <TableCell>Precio</TableCell>
                                    <TableCell>Costo</TableCell>
                                    <TableCell>SKU</TableCell>
                                    <TableCell>Manufacturado</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{product.description}</TableCell>
                                        <TableCell>{product.price}</TableCell>
                                        <TableCell>{product.cost}</TableCell>
                                        <TableCell>{product.sku}</TableCell>
                                        <TableCell>{product.is_manufactured ? 'Sí' : 'No'}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleOpenProductForm(product)}><EditIcon /></IconButton>
                                            <IconButton onClick={() => handleDeleteProduct(product.id)}><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <ProductForm
                    open={isProductFormOpen}
                    onClose={handleCloseProductForm}
                    onSave={handleSaveProduct}
                    product={selectedProduct}
                />

                
            </TabPanel>
        </Box>
    );
};

export default InventoryManagement;


