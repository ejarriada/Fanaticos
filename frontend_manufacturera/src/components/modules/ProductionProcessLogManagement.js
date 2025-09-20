import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ProductionProcessLog Form Dialog Component
const ProductionProcessLogForm = ({ open, onClose, onSave, productionProcessLog }) => {
    const [formData, setFormData] = useState({});
    const [productionOrders, setProductionOrders] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [dependenciesError, setDependenciesError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [productionOrdersData, processesData, rawMaterialsData] = await Promise.all([
                    api.list('/production-orders/'),
                    api.list('/processes/'),
                    api.list('/raw-materials/'),
                ]);
                setProductionOrders(Array.isArray(productionOrdersData) ? productionOrdersData : productionOrdersData.results || []);
                setProcesses(Array.isArray(processesData) ? processesData : processesData.results || []);
                setRawMaterials(Array.isArray(rawMaterialsData) ? rawMaterialsData : rawMaterialsData.results || []);
            } catch (err) {
                setDependenciesError('Error al cargar dependencias (órdenes de producción, procesos, materia prima).');
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
        if (productionProcessLog) {
            setFormData({
                ...productionProcessLog,
                start_time: productionProcessLog.start_time ? new Date(productionProcessLog.start_time).toISOString().slice(0, 16) : '',
                end_time: productionProcessLog.end_time ? new Date(productionProcessLog.end_time).toISOString().slice(0, 16) : '',
                production_order: productionProcessLog.production_order?.id || '',
                process: productionProcessLog.process?.id || '',
                raw_materials_consumed: productionProcessLog.raw_materials_consumed ? productionProcessLog.raw_materials_consumed.map(rm => rm.id) : [],
            });
        } else {
            setFormData({
                production_order: '',
                process: '',
                start_time: new Date().toISOString().slice(0, 16),
                end_time: '',
                quantity_processed: '',
                quantity_defective: '',
                failure_details: '',
                raw_materials_consumed: [],
            });
        }
    }, [productionProcessLog, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMultiSelectChange = (e) => {
        const { value } = e.target;
        setFormData({ ...formData, raw_materials_consumed: typeof value === 'string' ? value.split(',') : value });
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
            <DialogTitle>{productionProcessLog ? 'Editar Registro de Proceso' : 'Nuevo Registro de Proceso'}</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    name="production_order"
                    label="Orden de Producción"
                    select
                    fullWidth
                    value={formData.production_order || ''}
                    onChange={handleChange}
                >
                    {productionOrders.map((po) => (
                        <MenuItem key={po.id} value={po.id}>
                            OP #{po.id} ({po.product_design_name || po.product_design})
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    name="process"
                    label="Proceso"
                    select
                    fullWidth
                    value={formData.process || ''}
                    onChange={handleChange}
                >
                    {processes.map((process) => (
                        <MenuItem key={process.id} value={process.id}>
                            {process.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="start_time" label="Hora de Inicio" type="datetime-local" fullWidth value={formData.start_time || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="end_time" label="Hora de Fin" type="datetime-local" fullWidth value={formData.end_time || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="quantity_processed" label="Cantidad Procesada" type="number" fullWidth value={formData.quantity_processed || ''} onChange={handleChange} />
                <TextField margin="dense" name="quantity_defective" label="Cantidad Defectuosa" type="number" fullWidth value={formData.quantity_defective || ''} onChange={handleChange} />
                <TextField margin="dense" name="failure_details" label="Detalles de Fallo" type="text" fullWidth value={formData.failure_details || ''} onChange={handleChange} multiline rows={2} />
                
                <TextField
                    margin="dense"
                    name="raw_materials_consumed"
                    label="Materia Prima Consumida"
                    select
                    SelectProps={{
                        multiple: true,
                        value: formData.raw_materials_consumed || [],
                        onChange: handleMultiSelectChange,
                    }}
                    fullWidth
                >
                    {rawMaterials.map((rm) => (
                        <MenuItem key={rm.id} value={rm.id}>
                            {rm.name} (Lote: {rm.batch_number})
                        </MenuItem>
                    ))}
                </TextField>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main ProductionProcessLog Management Component
const ProductionProcessLogManagement = () => {
    const [productionProcessLogs, setProductionProcessLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProductionProcessLog, setSelectedProductionProcessLog] = useState(null);
    const { tenantId } = useAuth();

    const fetchProductionProcessLogs = async () => {
        try {
            setLoading(true);
            const data = await api.list('/production-process-logs/');
            const productionProcessLogList = Array.isArray(data) ? data : data.results;
            setProductionProcessLogs(productionProcessLogList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los registros de proceso. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchProductionProcessLogs();
        }
    }, [tenantId]);

    const handleOpenForm = (productionProcessLog = null) => {
        setSelectedProductionProcessLog(productionProcessLog);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedProductionProcessLog(null);
        setIsFormOpen(false);
    };

    const handleSave = async (productionProcessLogData) => {
        try {
            const dataToSend = {
                ...productionProcessLogData,
                production_order: productionProcessLogData.production_order || null,
                process: productionProcessLogData.process || null,
                raw_materials_consumed: productionProcessLogData.raw_materials_consumed || [],
            };

            if (selectedProductionProcessLog) {
                await api.update('/production-process-logs/', selectedProductionProcessLog.id, dataToSend);
            } else {
                await api.create('/production-process-logs/', dataToSend);
            }
            fetchProductionProcessLogs(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el registro de proceso.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este registro de proceso?')) {
            try {
                await api.remove('/production-process-logs/', id);
                fetchProductionProcessLogs(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el registro de proceso.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Registros de Proceso de Producción</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Registro de Proceso
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Orden de Producción</TableCell>
                                <TableCell>Proceso</TableCell>
                                <TableCell>Hora de Inicio</TableCell>
                                <TableCell>Hora de Fin</TableCell>
                                <TableCell>Cantidad Procesada</TableCell>
                                <TableCell>Cantidad Defectuosa</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {productionProcessLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.production_order_id || log.production_order}</TableCell>
                                    <TableCell>{log.process_name || log.process}</TableCell>
                                    <TableCell>{log.start_time}</TableCell>
                                    <TableCell>{log.end_time}</TableCell>
                                    <TableCell>{log.quantity_processed}</TableCell>
                                    <TableCell>{log.quantity_defective}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(log)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(log.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ProductionProcessLogForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                productionProcessLog={selectedProductionProcessLog} 
            />
        </Box>
    );
};

export default ProductionProcessLogManagement;
