import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, CircularProgress, Alert, Tabs, Tab 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import QuotationForm from './QuotationForm';

// Main Quotation Management Component
const QuotationManagement = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { tenantId } = useAuth();
    const [currentTab, setCurrentTab] = useState(0);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [formKey, setFormKey] = useState(0);

    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const data = await api.list('/quotations/');
            const quotationList = Array.isArray(data) ? data : data.results;
            setQuotations(quotationList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los presupuestos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchQuotations();
        }
    }, [tenantId]);

    const handleOpenForm = (quotation = null) => {
        setSuccess(null);
        setError(null);
        setSelectedQuotation(quotation);
        setFormKey(quotation ? quotation.id : Date.now()); // Force re-mount
        setCurrentTab(1); // Switch to form tab
    };

    const handleSave = async (quotationData) => {
        setError(null);
        setSuccess(null);

        try {
            let savedQuotation;
            if (quotationData.id) {
                savedQuotation = await api.update('/quotations/', quotationData.id, quotationData);
                setSuccess(`El presupuesto ${savedQuotation.quotation_id} se actualizó exitosamente`);
                setCurrentTab(0); // Switch back to list tab
                setSelectedQuotation(null); // Clear selected quotation
            } else {
                savedQuotation = await api.create('/quotations/', quotationData);
                setSuccess(`El presupuesto ${savedQuotation.quotation_id} se generó exitosamente`);
                setSelectedQuotation(null); // Clear form by resetting the selected quotation
                setFormKey(Date.now()); // Set a new key to force re-mount
            }
            fetchQuotations(); // Refresh list in the background

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);

        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el presupuesto.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta cotización?')) {
            try {
                await api.remove('/quotations/', id);
                fetchQuotations(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la cotización.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Presupuestos</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={(event, newValue) => setCurrentTab(newValue)} aria-label="quotation tabs">
                    <Tab label="Listado de Presupuestos" />
                    <Tab label="Formulario de Cotización" />
                </Tabs>
            </Box>
            <Box sx={{ p: 3 }}>
                {currentTab === 0 && (
                    <Box>
                        <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                            Nueva Cotización
                        </Button>

                        {loading && <CircularProgress />}
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}

                        {!loading && !error && (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>Cliente</TableCell>
                                            <TableCell>Teléfono</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Fecha</TableCell>
                                            <TableCell>Monto $</TableCell>
                                            <TableCell>Usuario</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {quotations.map((quotation) => (
                                            <TableRow key={quotation.id}>
                                                <TableCell>{quotation.quotation_id}</TableCell>
                                                <TableCell>{quotation.client?.name || 'N/A'}</TableCell>
                                                <TableCell>{quotation.client?.phone || 'N/A'}</TableCell>
                                                <TableCell>{quotation.client?.email || 'N/A'}</TableCell>
                                                <TableCell>{quotation.date}</TableCell>
                                                <TableCell>{quotation.total_amount}</TableCell>
                                                <TableCell>{quotation.user?.email || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => handleOpenForm(quotation)} title="Editar"><EditIcon /></IconButton>
                                                    <IconButton onClick={() => handleDelete(quotation.id)} title="Eliminar"><DeleteIcon /></IconButton>
                                                    <IconButton onClick={() => alert('Imprimiendo...')} title="Imprimir"><PrintIcon /></IconButton>
                                                    <IconButton onClick={() => alert('Yendo a venta...')} title="Ir a Venta"><ShoppingCartIcon /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}
                {currentTab === 1 && (
                    <Box>
                        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
                        {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
                        <QuotationForm
                            key={formKey} // Force re-mount to reset state
                            open={true} // Always open when this tab is active
                            onClose={() => { setCurrentTab(0); setSuccess(null); setError(null); }} // Close form, go back to list
                            onSave={handleSave}
                            quotation={selectedQuotation}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default QuotationManagement;
