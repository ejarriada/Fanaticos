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
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// RawMaterial Form Dialog Component
const RawMaterialForm = ({ open, onClose, onSave, rawMaterial }) => {
    const [formData, setFormData] = useState({});
    const [suppliers, setSuppliers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [suppliersError, setSuppliersError] = useState(null);
    const [brandsList, setBrandsList] = useState([]); // List of brands
    const [loadingBrands, setLoadingBrands] = useState(true);
    const [brandsError, setBrandsError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchSuppliersAndBrands = async () => {
            try {
                setLoadingSuppliers(true);
                setLoadingBrands(true);

                const suppliersData = await api.list('/suppliers/');
                setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.results || []);

                const brandsData = await api.list('/brands/');
                setBrandsList(Array.isArray(brandsData) ? brandsData : brandsData.results || []);

            } catch (err) {
                setSuppliersError('Error al cargar los proveedores.');
                setBrandsError('Error al cargar las marcas.');
                console.error(err);
            } finally {
                setLoadingSuppliers(false);
                setLoadingBrands(false);
            }
        };

        if (tenantId && open) {
            fetchSuppliersAndBrands();
        }
    }, [tenantId, open]);

    useEffect(() => {
        if (rawMaterial) {
            // When editing, rawMaterial is a MateriaPrimaProveedor object
            setFormData({
                ...rawMaterial,
                supplier: rawMaterial.supplier, // It should be the ID
                name: rawMaterial.name,
                description: rawMaterial.description, // Assuming description is available
                category: rawMaterial.category,
                unit_of_measure: rawMaterial.unit_of_measure,
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
                brands: [],
                current_stock: '',
            });
        }
    }, [rawMaterial, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingSuppliers || loadingBrands) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando datos...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (suppliersError || brandsError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    {suppliersError && <Alert severity="error">{suppliersError}</Alert>}
                    {brandsError && <Alert severity="error">{brandsError}</Alert>}
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
                <FormControl fullWidth margin="dense">
                    <InputLabel>Marcas</InputLabel>
                    <Select
                        name="brands"
                        multiple
                        value={formData.brands || []}
                        onChange={handleChange}
                        label="Marcas"
                    >
                        {brandsList.map((brand) => (
                            <MenuItem key={brand.id} value={brand.id}>
                                {brand.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField margin="dense" name="cost" label="Costo" type="number" fullWidth value={formData.cost} onChange={handleChange} />
                <TextField margin="dense" name="current_stock" label="Stock Actual" type="number" fullWidth value={formData.current_stock || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// QR Code Display Dialog Component
const QrCodeDisplayDialog = ({ open, onClose, qrCodeData }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Código QR de Materia Prima</DialogTitle>
            <DialogContent>
                {qrCodeData ? (
                    <img src={`data:image/png;base64,${qrCodeData}`} alt="QR Code" style={{ width: '100%', height: 'auto' }} />
                ) : (
                    <Typography>No hay datos de QR disponibles.</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
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
    const { tenantId } = useAuth();

    const handleGenerateQrCode = async (rawMaterial) => {
        try {
            setLoading(true);
            const response = await api.create(`/raw-materials/${rawMaterial.id}/generate_qr_code/`, {});
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
            setRawMaterials(data.results || (Array.isArray(data) ? data : []));
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
                // Editing existing MateriaPrimaProveedor
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
                    brands: formData.brands,
                    raw_material: selectedRawMaterial.raw_material, // re-associate the raw_material
                };
                await api.update('/materia-prima-proveedores/', selectedRawMaterial.id, materiaPrimaProveedorUpdateData);

            } else {
                // Creating new RawMaterial and MateriaPrimaProveedor
                const rawMaterialData = {
                    name: formData.name,
                    description: formData.description,
                    category: formData.category,
                    unit_of_measure: formData.unit_of_measure,
                };
                const newRawMaterial = await api.create('/raw-materials/', rawMaterialData);

                const materiaPrimaProveedorData = {
                    raw_material: newRawMaterial.id,
                    supplier: formData.supplier,
                    cost: formData.cost,
                    current_stock: formData.current_stock,
                    brands: formData.brands,
                };
                await api.create('/materia-prima-proveedores/', materiaPrimaProveedorData);
            }
            fetchRawMaterials();
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la materia prima.';
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
            />}

            {isQrDialogOpen && (
                <QrCodeDisplayDialog
                    open={isQrDialogOpen}
                    onClose={() => setIsQrDialogOpen(false)}
                    qrCodeData={qrCodeData}
                />
            )}
        </Box>
    );
};

export default RawMaterialList;
