import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, CircularProgress, Alert,
    MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import BrandForm from './BrandForm';
import QrCodeDisplayDialog from './QrCodeDisplayDialog';

// RawMaterial Form Dialog Component
const RawMaterialForm = ({ open, onClose, onSave, rawMaterial, onNewBrand, onBrandCreated }) => {
    const [formData, setFormData] = useState({});
    const [suppliers, setSuppliers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [suppliersError, setSuppliersError] = useState(null);
    const [brandsList, setBrandsList] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(true);
    const [brandsError, setBrandsError] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingWarehouses, setLoadingWarehouses] = useState(true);
    const [warehousesError, setWarehousesError] = useState(null);
    const { tenantId } = useAuth();

    const fetchBrands = async () => {
        try {
            setLoadingBrands(true);
            const brandsData = await api.list('/brands/');
            setBrandsList(Array.isArray(brandsData) ? brandsData : brandsData.results || []);
            setBrandsError(null);
        } catch (err) {
            setBrandsError('Error al cargar las marcas.');
            console.error(err);
        } finally {
            setLoadingBrands(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            setLoadingWarehouses(true);
            const warehousesData = await api.list('/warehouses/');
            setWarehouses(Array.isArray(warehousesData) ? warehousesData : warehousesData.results || []);
            setWarehousesError(null);
        } catch (err) {
            setWarehousesError('Error al cargar los almacenes.');
            console.error(err);
        } finally {
            setLoadingWarehouses(false);
        }
    };

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                setLoadingSuppliers(true);
                const suppliersData = await api.list('/suppliers/');
                setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.results || []);
                setSuppliersError(null);
            } catch (err) {
                setSuppliersError('Error al cargar los proveedores.');
                console.error(err);
            } finally {
                setLoadingSuppliers(false);
            }
        };

        if (tenantId && open) {
            fetchSuppliers();
            fetchBrands();
            fetchWarehouses();
        }
    }, [tenantId, open]);
    
    useEffect(() => {
        if (onBrandCreated) {
            fetchBrands();
        }
    }, [onBrandCreated]);

    useEffect(() => {
        if (rawMaterial) {
            setFormData({
                ...rawMaterial,
                supplier: rawMaterial.supplier, 
                name: rawMaterial.name,
                description: rawMaterial.description, 
                category: rawMaterial.category,
                unit_of_measure: rawMaterial.unit_of_measure,
                brand: rawMaterial.brand || '',
                warehouse: rawMaterial.warehouse || '',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                category: '',
                unit_of_measure: '',
                supplier: '',
                batch_number: '',
                cost: 0,
                brand: '',
                current_stock: '',
                warehouse: '',
            });
        }
    }, [rawMaterial, open]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let newValue = value;

        if (name === 'supplier' && value === '') {
            newValue = null; // Send null for optional ForeignKey
        } else if (name === 'current_stock' && value === '') {
            newValue = 0; // Send 0 for empty stock field
        } else if (type === 'number') {
            newValue = value === '' ? '' : Number(value); // Keep as string if empty, convert to number otherwise
        }
        setFormData({ ...formData, [name]: newValue });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingSuppliers) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando datos...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (suppliersError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    {suppliersError && <Alert severity="error">{suppliersError}</Alert>}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{rawMaterial ? 'Editar Materia Prima' : 'Nueva Materia Prima'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre de Materia Prima" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth value={formData.description || ''} onChange={handleChange} />
                <TextField margin="dense" name="category" label="Categoría" type="text" fullWidth value={formData.category || ''} onChange={handleChange} />
                <TextField margin="dense" name="unit_of_measure" label="Unidad de Medida" type="text" fullWidth value={formData.unit_of_measure || ''} onChange={handleChange} />
                <FormControl fullWidth margin="dense">
                    <InputLabel>Proveedor</InputLabel>
                    <Select
                        name="supplier"
                        value={formData.supplier || ''}
                        onChange={handleChange}
                        label="Proveedor"
                    >
                        <MenuItem value=""><em>Ninguno</em></MenuItem>
                        {suppliers.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField margin="dense" name="batch_number" label="Número de Lote" type="text" fullWidth value={formData.batch_number || ''} onChange={handleChange} />
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Marca</InputLabel>
                        <Select
                            name="brand"
                            value={formData.brand || ''}
                            onChange={handleChange}
                            label="Marca"
                        >
                            {brandsList.map((brand) => (
                                <MenuItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <IconButton onClick={onNewBrand} color="primary">
                        <AddIcon />
                    </IconButton>
                </Box>
                <TextField margin="dense" name="cost" label="Costo" type="number" fullWidth value={formData.cost} onChange={handleChange} />
                <FormControl fullWidth margin="dense">
                    <InputLabel>Almacén</InputLabel>
                    <Select
                        name="warehouse"
                        value={formData.warehouse || ''}
                        onChange={handleChange}
                        label="Almacén"
                    >
                        <MenuItem value=""><em>Ninguno</em></MenuItem>
                        {warehouses.map((w) => (
                            <MenuItem key={w.id} value={w.id}>
                                {w.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField margin="dense" name="current_stock" label="Stock Actual" type="number" fullWidth value={formData.current_stock || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main RawMaterial Management Component
const RawMaterialList = () => {
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRawMaterial, setSelectedRawMaterial] = useState(null);
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);
    const [brandCreated, setBrandCreated] = useState(false);
    const { tenantId } = useAuth();

    const handleGenerateQrCode = async (rawMaterial) => {
        try {
            setLoading(true);
            const response = await api.create(`/materia-prima-proveedores/${rawMaterial.id}/generate_qr_code/`, {});
            setQrCodeData(response.qr_code_data);
            setIsQrDialogOpen(true);
            setError(null);
        } catch (err) {
            setError('Error al generar el código QR. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRawMaterials = async () => {
        try {
            setLoading(true);
            const data = await api.list('/materia-prima-proveedores/');
            console.log("fetchRawMaterials: Data received from API:", data);
            const processedData = data.results || (Array.isArray(data) ? data : []);
            setRawMaterials(processedData);
            setError(null);
        } catch (err) {
            setError('Error al cargar la materia prima. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchRawMaterials();
        }
    }, [tenantId]);

    const handleOpenForm = (rawMaterial = null) => {
        setSelectedRawMaterial(rawMaterial);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedRawMaterial(null);
        setIsFormOpen(false);
    };

    const handleSave = async (formData) => {
        try {
            if (selectedRawMaterial) {
                const rawMaterialUpdateData = {
                    name: formData.name,
                    description: formData.description,
                    category: formData.category,
                    unit_of_measure: formData.unit_of_measure,
                };
                await api.update('/raw-materials/', selectedRawMaterial.raw_material, rawMaterialUpdateData);

                const materiaPrimaProveedorUpdateData = {
                    supplier: formData.supplier,
                    cost: formData.cost,
                    current_stock: formData.current_stock,
                    brand: formData.brand,
                    warehouse: formData.warehouse,
                    raw_material: selectedRawMaterial.raw_material, 
                };
                await api.update('/materia-prima-proveedores/', selectedRawMaterial.id, materiaPrimaProveedorUpdateData);

            } else {
                let rawMaterialId;
                // Try to find an existing RawMaterial by name
                const existingRawMaterialsResponse = await api.list('/raw-materials/', { name: formData.name });
                const existingRawMaterials = Array.isArray(existingRawMaterialsResponse) 
                    ? existingRawMaterialsResponse 
                    : existingRawMaterialsResponse.results || [];

                if (existingRawMaterials.length > 0) {
                    // Si existe, usar el ID existente
                    rawMaterialId = existingRawMaterials[0].id;
                } else {
                    // Si no existe, crear la materia prima base primero
                    const rawMaterialData = {
                        name: formData.name,
                        description: formData.description,
                        category: formData.category,
                        unit_of_measure: formData.unit_of_measure,
                    };
                    const newRawMaterial = await api.create('/raw-materials/', rawMaterialData);
                    rawMaterialId = newRawMaterial.id;
                }

                // Ahora sí, crear la relación materia-prima-proveedor con el ID correcto
                const materiaPrimaProveedorData = {
                    raw_material: rawMaterialId,
                    supplier: formData.supplier || null,
                    cost: formData.cost || 0,
                    current_stock: formData.current_stock || 0,
                    brand: formData.brand || null,
                    warehouse: formData.warehouse || null,
                };
                await api.create('/materia-prima-proveedores/', materiaPrimaProveedorData);
            }
            fetchRawMaterials();
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            let errorMessage = 'Error al guardar la materia prima.';

            if (errorData) {
                if (typeof errorData === 'object') {
                    errorMessage = Object.entries(errorData)
                        .map(([key, value]) => {
                            const fieldName = key === 'name' ? 'Nombre' : key;
                            return `${fieldName}: ${Array.isArray(value) ? value.join(', ') : value}`;
                        })
                        .join('; ');
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
            }
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta materia prima?')) {
            try {
                await api.remove('/materia-prima-proveedores/', id);
                fetchRawMaterials();
            } catch (err) {
                setError('Error al eliminar la materia prima.');
                console.error(err);
            }
        }
    };

    const handleSaveNewBrand = async (brandData) => {
        try {
            await api.create('/brands/', brandData);
            setIsBrandFormOpen(false);
            setBrandCreated(!brandCreated); // Toggle to trigger re-fetch in form
        } catch (err) {
            // Improved error handling can be added here
            console.error("Error creating brand", err);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Gestión de Materia Prima</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Materia Prima
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Número de Lote</TableCell>
                                <TableCell>Proveedor</TableCell>
                                <TableCell>Almacén</TableCell>
                                <TableCell>Costo</TableCell>
                                <TableCell>Categoría</TableCell>
                                <TableCell>Stock Actual</TableCell>
                                <TableCell>Unidad de Medida</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rawMaterials.map((rm) => (
                                <TableRow key={rm.id}>
                                    <TableCell>{rm.name}</TableCell>
                                    <TableCell>{rm.batch_number}</TableCell>
                                    <TableCell>{rm.supplier_name || 'N/A'}</TableCell>
                                    <TableCell>{rm.warehouse_name || 'Sin asignar'}</TableCell>
                                    <TableCell>{rm.cost}</TableCell>
                                    <TableCell>{rm.category}</TableCell>
                                    <TableCell>{rm.current_stock}</TableCell>
                                    <TableCell>{rm.unit_of_measure}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(rm)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(rm.id)}><DeleteIcon /></IconButton>
                                        {rm.id && (
                                            <IconButton onClick={() => handleGenerateQrCode(rm)} title="Generar QR">
                                                <QrCodeIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {isFormOpen && <RawMaterialForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                rawMaterial={selectedRawMaterial}
                onNewBrand={() => setIsBrandFormOpen(true)}
                onBrandCreated={brandCreated}
            />}

            <BrandForm 
                open={isBrandFormOpen}
                onClose={() => setIsBrandFormOpen(false)}
                onSave={handleSaveNewBrand}
            />

            {isQrDialogOpen && (
                <QrCodeDisplayDialog
                    open={isQrDialogOpen}
                    onClose={() => setIsQrDialogOpen(false)}
                    qrCodeData={qrCodeData}
                    title="Código QR de Materia Prima"
                />
            )}
        </Box>
    );
};

export default RawMaterialList;