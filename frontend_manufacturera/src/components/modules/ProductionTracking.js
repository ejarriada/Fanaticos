import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, MenuItem, Select, 
    InputLabel, FormControl, Paper, Grid, Chip, Divider, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, IconButton, List, ListItem, ListItemText
} from '@mui/material';
import QRCode from 'qrcode';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import * as api from '../../utils/api';

const ProductionTracking = () => {
    const [selectedProductionOrder, setSelectedProductionOrder] = useState('');
    const [productionOrders, setProductionOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);
    const [currentProcesses, setCurrentProcesses] = useState([]);
    const [fileViewerOpen, setFileViewerOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    // Generar QR cuando cambia la orden seleccionada
    useEffect(() => {
        if (orderData) {
            generateQRCode(orderData.id);
        }
    }, [orderData]);

    const generateQRCode = async (orderId) => {
        try {
            const qrData = JSON.stringify({
                type: 'production_order',
                id: orderId,
                timestamp: Date.now()
            });
            const qrUrl = await QRCode.toDataURL(qrData, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 200
            });
            setQrCodeUrl(qrUrl);
        } catch (error) {
            console.error('Error generando QR:', error);
        }
    };

    // Cargar órdenes de producción
    useEffect(() => {
        const fetchProductionOrders = async () => {
            try {
                setLoading(true);
                const data = await api.list('/production-orders/');
                const orders = data.results || data || [];
                // Filtrar solo órdenes activas/en proceso
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

    // Generar procesos dinámicos basados en la OP
    const generateProcesses = (orderData) => {
        if (!orderData) return [];

        const processes = [];
        
        if (orderData.op_type === 'Indumentaria') {
            // Procesos base obligatorios
            processes.push(
                { name: 'Corte', required: true, status: 'pending' },
                { name: 'Costura', required: true, status: 'pending' }
            );

            // Procesos específicos basados en customization_details
            const customization = orderData.customization_details || {};
            
            if (customization.escudo === 'Sublimado' || 
                customization.marca === 'Sublimado' || 
                customization.numero === 'Sublimado' || 
                customization.nombre === 'Sublimado') {
                processes.push({ name: 'Sublimación', required: true, status: 'pending' });
            }

            if (customization.escudo === 'Bordado' || customization.marca === 'Bordado') {
                processes.push({ name: 'Bordado', required: true, status: 'pending' });
            }

            if (customization.escudo === 'Vinilo' || 
                customization.marca === 'Vinilo' || 
                customization.numero === 'Vinilo' || 
                customization.nombre === 'Vinilo') {
                processes.push({ name: 'Estampado', required: true, status: 'pending' });
            }

            // Verificar si hay procesos de serigrafía (esto podría venir de otros campos)
            // processes.push({ name: 'Serigrafía', required: false, status: 'pending' });

            // Procesos finales obligatorios
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
                // Cargar detalles completos de la orden
                const orderDetails = await api.get('/production-orders/', orderId);
                setOrderData(orderDetails);
                
                // Generar procesos dinámicos
                const processes = generateProcesses(orderDetails);
                setCurrentProcesses(processes);
            } catch (err) {
                setError('Error al cargar los detalles de la orden.');
                console.error(err);
            }
        } else {
            setOrderData(null);
            setCurrentProcesses([]);
        }
    };

    const handleProcessAction = (processName, action) => {
        // Aquí implementarías la lógica para iniciar/finalizar proceso
        // Por ahora solo actualiza el estado local
        setCurrentProcesses(prev => 
            prev.map(process => 
                process.name === processName 
                    ? { ...process, status: action === 'start' ? 'in_progress' : 'completed' }
                    : process
            )
        );
        
        console.log(`Proceso ${processName}: ${action}`);
        // TODO: Enviar al backend el cambio de estado del proceso
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
        
        return (
            <Card sx={{ mt: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Especificaciones de Personalización</Typography>
                    <Grid container spacing={2}>
                        {details.map(([key, value]) => (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                                <Typography variant="body2" color="textSecondary">
                                    {key.replace('_', ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {value}
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderOrderDetails = () => {
        if (!orderData) return null;

        return (
            <Box sx={{ mt: 3 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Detalles de la Orden</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography><strong>Producto:</strong> {orderData.base_product?.name || 'N/A'}</Typography>
                            <Typography><strong>Cliente:</strong> {orderData.order_note?.sale?.client?.name || 'Decisión Interna'}</Typography>
                            <Typography><strong>Cantidad Total:</strong> {
                                orderData.items?.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0) || 0
                            } {orderData.op_type === 'Medias' ? 'pares' : 'prendas'}</Typography>
                            <Typography><strong>Fecha Estimada de Entrega:</strong> {
                                orderData.estimated_delivery_date ? 
                                    new Date(orderData.estimated_delivery_date).toLocaleDateString() : 
                                    'N/A'
                            }</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography><strong>Vendedor:</strong> {orderData.seller?.name || 'N/A'}</Typography>
                            <Typography><strong>Tipo de OP:</strong> {orderData.op_type}</Typography>
                            <Typography><strong>Estado:</strong> 
                                <Chip 
                                    label={orderData.status} 
                                    color={orderData.status === 'Pendiente' ? 'warning' : 'info'}
                                    size="small"
                                    sx={{ ml: 1 }}
                                />
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* Detalles de Talles */}
                    {orderData.items && orderData.items.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>Talles a Producir</Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Talle</TableCell>
                                            <TableCell>Cantidad</TableCell>
                                            {orderData.op_type === 'Indumentaria' && <TableCell>Arquero</TableCell>}
                                            {orderData.op_type === 'Medias' && <TableCell>Detalle</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {orderData.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.size}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                {orderData.op_type === 'Indumentaria' && (
                                                    <TableCell>{item.is_goalie ? 'Sí' : 'No'}</TableCell>
                                                )}
                                                {orderData.op_type === 'Medias' && (
                                                    <TableCell>{item.detail || '-'}</TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {/* Especificaciones de Personalización */}
                    {orderData.customization_details && renderCustomizationDetails(orderData.customization_details)}

                    {/* Especificaciones para Medias */}
                    {orderData.op_type === 'Medias' && (orderData.colors || orderData.specifications) && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                {orderData.colors && (
                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>Colores</Typography>
                                                {Object.entries(orderData.colors).map(([key, value]) => (
                                                    <Typography key={key}>
                                                        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                                                    </Typography>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}
                                {orderData.specifications && (
                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>Especificaciones Técnicas</Typography>
                                                {Object.entries(orderData.specifications).map(([key, value]) => (
                                                    <Typography key={key}>
                                                        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                                                    </Typography>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}

                    {/* Archivos de Moldería */}
                    {orderData.files && orderData.files.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>Archivos de Moldería y Diseño</Typography>
                            <List>
                                {orderData.files.map((file, index) => (
                                    <ListItem key={index} sx={{ border: '1px solid #eee', mb: 1, borderRadius: 1 }}>
                                        <ListItemText 
                                            primary={file.file?.split('/').pop() || `Archivo ${index + 1}`}
                                            secondary={`Tipo: ${file.file_type || 'General'}`}
                                        />
                                        <IconButton onClick={() => handleFileView(file)} color="primary">
                                            <VisibilityIcon />
                                        </IconButton>
                                        <IconButton 
                                            component="a" 
                                            href={file.file} 
                                            target="_blank" 
                                            color="primary"
                                        >
                                            <DownloadIcon />
                                        </IconButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    <Divider sx={{ my: 3 }} />

                    {/* Procesos de Producción */}
                    <Typography variant="h6" gutterBottom>Proceso Actual</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {currentProcesses.map((process, index) => (
                            <Button
                                key={index}
                                variant={process.status === 'completed' ? 'contained' : 'outlined'}
                                color={getProcessButtonColor(process.status)}
                                startIcon={getProcessIcon(process.status)}
                                onClick={() => handleProcessAction(
                                    process.name, 
                                    process.status === 'pending' ? 'start' : 
                                    process.status === 'in_progress' ? 'complete' : 'view'
                                )}
                                disabled={process.status === 'completed'}
                                sx={{ minWidth: 140 }}
                            >
                                {process.name}
                            </Button>
                        ))}
                    </Box>

                    {/* QR de Seguimiento */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>QR de Seguimiento</Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Código QR para seguimiento en puestos de trabajo - OP #{orderData.id}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {qrCodeUrl ? (
                                <img 
                                    src={qrCodeUrl} 
                                    alt={`QR Code OP ${orderData.id}`}
                                    style={{ 
                                        width: 150, 
                                        height: 150,
                                        border: '2px solid #ddd',
                                        borderRadius: 4,
                                        backgroundColor: 'white'
                                    }} 
                                />
                            ) : (
                                <Box sx={{ 
                                    width: 150, 
                                    height: 150, 
                                    bgcolor: 'white', 
                                    border: '2px dashed #ccc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 1
                                }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Generando QR...
                                    </Typography>
                                </Box>
                            )}
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Datos del QR:
                                </Typography>
                                <Typography variant="body2" fontFamily="monospace">
                                    Tipo: production_order
                                </Typography>
                                <Typography variant="body2" fontFamily="monospace">
                                    ID: {orderData.id}
                                </Typography>
                                <Typography variant="body2" fontFamily="monospace">
                                    Timestamp: {new Date().toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>
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
                <Select
                    value={selectedProductionOrder}
                    label="Seleccionar Orden de Producción"
                    onChange={handleOrderChange}
                    disabled={loading}
                >
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

            {/* Dialog para visualizar archivos */}
            <Dialog 
                open={fileViewerOpen} 
                onClose={() => setFileViewerOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Vista de Archivo</DialogTitle>
                <DialogContent>
                    {selectedFile && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography gutterBottom>
                                {selectedFile.file?.split('/').pop()}
                            </Typography>
                            {selectedFile.file?.endsWith('.pdf') ? (
                                <embed 
                                    src={selectedFile.file} 
                                    width="100%" 
                                    height="500px"
                                    type="application/pdf"
                                />
                            ) : (
                                <img 
                                    src={selectedFile.file} 
                                    alt="Archivo"
                                    style={{ maxWidth: '100%', maxHeight: '500px' }}
                                />
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ProductionTracking;