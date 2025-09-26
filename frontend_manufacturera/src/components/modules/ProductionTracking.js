import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, MenuItem, Select, 
    InputLabel, FormControl, Paper, Grid, Chip, Divider, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, IconButton, List, ListItem, ListItemText
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QrCodeIcon from '@mui/icons-material/QrCode';
import * as api from '../../utils/api';
import QrCodeDisplayDialog from './QrCodeDisplayDialog';

const ProductionTracking = () => {
    const [selectedProductionOrder, setSelectedProductionOrder] = useState('');
    const [productionOrders, setProductionOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);
    const [currentProcesses, setCurrentProcesses] = useState([]);
    const [fileViewerOpen, setFileViewerOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);

    useEffect(() => {
        const fetchProductionOrders = async () => {
            try {
                setLoading(true);
                const data = await api.list('/production-orders/');
                const orders = data.results || data || [];
                const activeOrders = orders.filter(order => 
                    order.status === 'En Proceso' || order.status === 'Pendiente'
                );
                setProductionOrders(activeOrders);
            } catch (err) {
                setError('Error al cargar las órdenes de producción.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProductionOrders();
    }, []);

    const generateProcesses = (orderData) => {
        if (!orderData) return [];
        const processes = [];
        if (orderData.op_type === 'Indumentaria') {
            processes.push(
                { name: 'Corte', required: true, status: 'pending' },
                { name: 'Costura', required: true, status: 'pending' }
            );
            const customization = orderData.customization_details || {};
            if (customization.escudo === 'Sublimado' || customization.marca === 'Sublimado' || customization.numero === 'Sublimado' || customization.nombre === 'Sublimado') {
                processes.push({ name: 'Sublimación', required: true, status: 'pending' });
            }
            if (customization.escudo === 'Bordado' || customization.marca === 'Bordado') {
                processes.push({ name: 'Bordado', required: true, status: 'pending' });
            }
            if (customization.escudo === 'Vinilo' || customization.marca === 'Vinilo' || customization.numero === 'Vinilo' || customization.nombre === 'Vinilo') {
                processes.push({ name: 'Estampado', required: true, status: 'pending' });
            }
            processes.push(
                { name: 'Limpieza/Planchado', required: true, status: 'pending' },
                { name: 'Empaque', required: true, status: 'pending' }
            );
        } else if (orderData.op_type === 'Medias') {
            processes.push(
                { name: 'Tejido', required: true, status: 'pending' },
                { name: 'Costura', required: true, status: 'pending' },
                { name: 'Limpieza/Planchado', required: true, status: 'pending' },
                { name: 'Empaque', required: true, status: 'pending' }
            );
        }
        return processes;
    };

    const handleOrderChange = async (event) => {
        const orderId = event.target.value;
        setSelectedProductionOrder(orderId);
        
        if (orderId) {
            try {
                const orderDetails = await api.get('/production-orders/', orderId);
                setOrderData(orderDetails);
                const processes = generateProcesses(orderDetails);
                setCurrentProcesses(processes);
            } catch (err) {
                setError('Error al cargar los detalles de la orden.');
                console.error(err);
            }
        } else {
            setOrderData(null);
            setCurrentProcesses([]);
            setQrCodeData(null);
        }
    };

    const handleGenerateQrCode = async () => {
        if (!orderData) return;
        try {
            const response = await api.create(`/production-orders/${orderData.id}/generate_qr_code/`, {});
            setQrCodeData(response.qr_code_data);
            setIsQrDialogOpen(true);
        } catch (err) {
            setError('Error al generar el código QR.');
            console.error(err);
        }
    };

    const handleProcessAction = async (processName, action) => {
        if (action === 'complete') {
            try {
                setLoading(true);
                const response = await api.postAction('/production-orders/', orderData.id, 'complete-process', { process_name: processName });
                setCurrentProcesses(prev => 
                    prev.map(process => 
                        process.name === processName 
                            ? { ...process, status: 'completed' }
                            : process
                    )
                );
                alert(response.message || 'Proceso completado con éxito.');
            } catch (err) {
                const errorMsg = err.response?.data?.error || 'Error al actualizar el proceso.';
                setError(errorMsg);
                console.error(err);
            } finally {
                setLoading(false);
            }
        } else if (action === 'start') {
            setCurrentProcesses(prev => 
                prev.map(process => 
                    process.name === processName 
                        ? { ...process, status: 'in_progress' }
                        : process
                )
            );
        }
        
        console.log(`Proceso ${processName}: ${action}`);
    };

    const handleFileView = (file) => {
        setSelectedFile(file);
        setFileViewerOpen(true);
    };

    const getProcessButtonColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'in_progress': return 'warning';
            default: return 'primary';
        }
    };

    const getProcessIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon />;
            case 'in_progress': return <StopIcon />;
            default: return <PlayArrowIcon />;
        }
    };

    const renderCustomizationDetails = (customization) => {
        if (!customization) return null;
        const details = Object.entries(customization).filter(([key, value]) => value && value !== 'No lleva');
        if (details.length === 0) return null;
        return (
            <Card sx={{ mt: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Especificaciones de Personalización</Typography>
                    <Grid container spacing={2}>
                        {details.map(([key, value]) => (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                                <Typography variant="body2" color="textSecondary">
                                    {key.replace(/_/g, ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderMediasSpecifications = (colors, specifications) => {
        if (!colors && !specifications) return null;
        return (
            <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                    {colors && Object.keys(colors).length > 0 && (
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Colores</Typography>
                                    {Object.entries(colors).filter(([key, value]) => value).map(([key, value]) => (
                                        <Typography key={key} sx={{ mb: 0.5 }}>
                                            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                                        </Typography>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                    {specifications && Object.keys(specifications).length > 0 && (
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Especificaciones Técnicas</Typography>
                                    {Object.entries(specifications).filter(([key, value]) => value).map(([key, value]) => (
                                        <Typography key={key} sx={{ mb: 0.5 }}>
                                            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                                        </Typography>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        );
    };

    const renderOrderDetails = () => {
        if (!orderData) return null;
        const totalQuantity = orderData.items?.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0) || 0;
        const quantityUnit = orderData.op_type === 'Medias' ? 'pares' : 'prendas';

        return (
            <Box sx={{ mt: 3 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Detalles de la Orden</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1 }}>
                                <strong>Producto:</strong> {orderData.base_product?.name || 'N/A'}
                            </Typography>
                            <Typography sx={{ mb: 1 }}>
                                <strong>Cliente:</strong> {orderData.order_note?.sale?.client?.name || 'Decisión Interna'}
                            </Typography>
                            <Typography sx={{ mb: 1 }}>
                                <strong>Cantidad Total:</strong> {totalQuantity} {quantityUnit}
                            </Typography>
                            <Typography sx={{ mb: 1 }}>
                                <strong>Fecha Estimada de Entrega:</strong> {
                                    orderData.estimated_delivery_date ? 
                                        new Date(orderData.estimated_delivery_date).toLocaleDateString() : 
                                        'N/A'
                                }
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1 }}>
                                <strong>Nota de Pedido Asociada:</strong> {orderData.order_note ? `#${orderData.order_note.id}` : 'N/A'}
                            </Typography>
                            <Typography sx={{ mb: 1 }}>
                                <strong>Vendedor:</strong> {orderData.order_note?.sale?.user?.first_name || 'N/A'}
                            </Typography>
                            <Typography sx={{ mb: 1 }}>
                                <strong>Tipo de OP:</strong> 
                                <Chip label={orderData.op_type} color="primary" size="small" sx={{ ml: 1 }}/>
                            </Typography>
                            <Typography sx={{ mb: 1 }}>
                                <strong>Estado:</strong>
                                <Chip label={orderData.status} color={orderData.status === 'Pendiente' ? 'warning' : 'info'} size="small" sx={{ ml: 1 }}/>
                            </Typography>
                        </Grid>
                    </Grid>

                    {orderData.op_type === 'Medias' && orderData.model && (
                        <Box sx={{ mt: 2 }}>
                            <Typography><strong>Modelo:</strong> {orderData.model}</Typography>
                        </Box>
                    )}

                    {orderData.details && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">Detalles Adicionales:</Typography>
                            <Typography>{orderData.details}</Typography>
                        </Box>
                    )}

                    {orderData.items && orderData.items.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>Talles a Producir</Typography>
                            <TableContainer><Table size="small"><TableHead><TableRow>
                                <TableCell><strong>Talle</strong></TableCell>
                                <TableCell><strong>Cantidad</strong></TableCell>
                                {orderData.op_type === 'Indumentaria' && <TableCell><strong>Arquero</strong></TableCell>}
                                {orderData.op_type === 'Medias' && <TableCell><strong>Detalle</strong></TableCell>}
                            </TableRow></TableHead><TableBody>
                                {orderData.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.size}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        {orderData.op_type === 'Indumentaria' && (<TableCell>{item.is_goalie ? 'Sí' : 'No'}</TableCell>)}
                                        {orderData.op_type === 'Medias' && (<TableCell>{item.detail || '-'}</TableCell>)}
                                    </TableRow>
                                ))}
                            </TableBody></Table></TableContainer>
                        </Box>
                    )}

                    {orderData.op_type === 'Indumentaria' && orderData.customization_details && renderCustomizationDetails(orderData.customization_details)}
                    {orderData.op_type === 'Medias' && renderMediasSpecifications(orderData.colors, orderData.specifications)}

                    {orderData.files && orderData.files.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>Archivos de Moldería y Diseño</Typography>
                            <List>
                                {orderData.files.map((file, index) => (
                                    <ListItem key={index} sx={{ border: '1px solid #eee', mb: 1, borderRadius: 1, bgcolor: 'grey.50'}}>
                                        <ListItemText primary={file.file?.split('/').pop() || `Archivo ${index + 1}`} secondary={`Tipo: ${file.file_type || 'General'}`}/>
                                        <IconButton onClick={() => handleFileView(file)} color="primary" title="Ver archivo"><VisibilityIcon /></IconButton>
                                        <IconButton component="a" href={file.file} target="_blank" color="primary" title="Descargar archivo"><DownloadIcon /></IconButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>Proceso Actual</Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>Haz clic en cada proceso para marcar inicio/finalización</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {currentProcesses.map((process, index) => (
                            <Button key={index} variant={process.status === 'completed' ? 'contained' : 'outlined'} color={getProcessButtonColor(process.status)} startIcon={getProcessIcon(process.status)} onClick={() => handleProcessAction(process.name, process.status === 'pending' ? 'start' : process.status === 'in_progress' ? 'complete' : 'view')} disabled={process.status === 'completed'} sx={{ minWidth: 160, height: 48 }}>
                                {process.name}
                            </Button>
                        ))}
                    </Box>

                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>QR de Seguimiento</Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>Código QR para seguimiento en puestos de trabajo - OP #{orderData.id}</Typography>
                        <Button variant="contained" startIcon={<QrCodeIcon />} onClick={handleGenerateQrCode}>
                            Generar / Ver QR
                        </Button>
                    </Box>
                </Paper>
            </Box>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Seguimiento de Órdenes de Producción</Typography>

            <FormControl fullWidth margin="dense" sx={{ mb: 3 }}>
                <InputLabel>Seleccionar Orden de Producción</InputLabel>
                <Select value={selectedProductionOrder} label="Seleccionar Orden de Producción" onChange={handleOrderChange} disabled={loading}>
                    <MenuItem value=""><em>Ninguna</em></MenuItem>
                    {productionOrders.map((order) => (
                        <MenuItem key={order.id} value={order.id}>
                            OP #{order.id} - {order.base_product?.name || 'Producto N/A'} ({order.order_note?.sale?.client?.name || 'Interno'})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            
            {renderOrderDetails()}

            <Dialog open={fileViewerOpen} onClose={() => setFileViewerOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Vista de Archivo</DialogTitle>
                <DialogContent>
                    {selectedFile && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography gutterBottom>{selectedFile.file?.split('/').pop()}</Typography>
                            {selectedFile.file?.toLowerCase().endsWith('.pdf') ? (
                                <embed src={selectedFile.file} width="100%" height="500px" type="application/pdf"/>
                            ) : (
                                <img src={selectedFile.file} alt="Archivo" style={{ maxWidth: '100%', maxHeight: '500px' }}/>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <QrCodeDisplayDialog 
                open={isQrDialogOpen}
                onClose={() => setIsQrDialogOpen(false)}
                qrCodeData={qrCodeData}
                title="Código QR de Seguimiento de OP"
            />
        </Box>
    );
};

export default ProductionTracking;