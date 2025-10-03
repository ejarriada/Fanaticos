import React, { useState, useEffect } from 'react';
import {
    Box, Tab, Tabs, Typography,
    TextField, Button, Checkbox, FormControlLabel, Select, MenuItem, FormControl, InputLabel, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import SupplierList from './SupplierList';
import ComprasProveedor from './ComprasProveedor';
import CuentaCorrienteProveedor from './CuentaCorrienteProveedor';
import PagosProveedor from './PagosProveedor';
import NewPurchaseForm from './NewPurchaseForm';
import BankForm from './BankForm'; // Import the BankForm component
import * as api from '../../utils/api';

// Formulario de Proveedor anidado para simplicidad de estado
const SupplierForm = ({ onSave, onCancel, supplier, suppliers, onSelectSupplier, banks, onNewBank }) => {
    const [formData, setFormData] = useState({});

    React.useEffect(() => {
        const defaultFormData = {
            name: '',
            contact_info: '',
            cuit_cuil: '',
            phone: '',
            category: '',
            cbu: '',
            branch: '',
            address: '',
            email: '',
            business_sector: '',
            iva_condition: '',
            bank: '',
            account_number: '',
            delivery_available: false,
        };
        setFormData(supplier ? { ...defaultFormData, ...supplier } : defaultFormData);
    }, [supplier]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelectChange = (e) => {
        const selectedSupplier = suppliers.find(s => s.id === e.target.value);
        onSelectSupplier(selectedSupplier);
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6">{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Seleccionar Proveedor</InputLabel>
                <Select
                    value={supplier ? supplier.id : ''}
                    onChange={handleSelectChange}
                    label="Seleccionar Proveedor"
                >
                    <MenuItem value="">
                        <em>Nuevo Proveedor</em>
                    </MenuItem>
                    {suppliers.map(s => (
                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField sx={{ mt: 2 }} margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
            <TextField sx={{ mt: 2 }} margin="dense" name="contact_info" label="Información de Contacto" type="text" fullWidth multiline rows={3} value={formData.contact_info || ''} onChange={handleChange} />
            <TextField sx={{ mt: 2 }} margin="dense" name="cuit_cuil" label="CUIT/CUIL" type="text" fullWidth value={formData.cuit_cuil || ''} onChange={handleChange} />
            <TextField sx={{ mt: 2 }} margin="dense" name="phone" label="Teléfono" type="text" fullWidth value={formData.phone || ''} onChange={handleChange} />
            <TextField sx={{ mt: 2 }} margin="dense" name="category" label="Categoría" type="text" fullWidth value={formData.category || ''} onChange={handleChange} />
            <TextField sx={{ mt: 2 }} margin="dense" name="cbu" label="CBU" type="text" fullWidth value={formData.cbu || ''} onChange={handleChange} />
            <TextField sx={{ mt: 2 }} margin="dense" name="branch" label="Sucursal" type="text" fullWidth value={formData.branch || ''} onChange={handleChange} />
            <TextField sx={{ mt: 2 }} margin="dense" name="address" label="Dirección" type="text" fullWidth value={formData.address || ''} onChange={handleChange} />
            <TextField sx={{ mt: 2 }} margin="dense" name="email" label="Email" type="email" fullWidth value={formData.email || ''} onChange={handleChange} />
            <TextField sx={{ mt: 2 }} margin="dense" name="business_sector" label="Rubro" type="text" fullWidth value={formData.business_sector || ''} onChange={handleChange} />
            <FormControl fullWidth sx={{ mt: 2 }} margin="dense">
                <InputLabel>Condición IVA</InputLabel>
                <Select
                    name="iva_condition"
                    value={formData.iva_condition || ''}
                    onChange={handleChange}
                    label="Condición IVA"
                >
                    <MenuItem value="Responsable Inscripto">Responsable Inscripto</MenuItem>
                    <MenuItem value="No Responsable">No Responsable</MenuItem>
                    <MenuItem value="Exento">Exento</MenuItem>
                    <MenuItem value="Responsable Monotributo">Responsable Monotributo</MenuItem>
                    <MenuItem value="Monotributista Social">Monotributista Social</MenuItem>
                </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <FormControl fullWidth>
                    <InputLabel>Banco</InputLabel>
                    <Select
                        name="bank"
                        value={formData.bank || ''}
                        onChange={handleChange}
                        label="Banco"
                    >
                        {banks.map(b => (
                            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <IconButton onClick={onNewBank} color="primary">
                    <AddIcon />
                </IconButton>
            </Box>

            <TextField sx={{ mt: 2 }} margin="dense" name="account_number" label="Número de Cuenta" type="text" fullWidth value={formData.account_number || ''} onChange={handleChange} />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={formData.delivery_available || false}
                        onChange={handleChange}
                        name="delivery_available"
                        color="primary"
                    />
                }
                label="Envío a domicilio"
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={onCancel} sx={{ mr: 1 }}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained">Guardar</Button>
            </Box>
        </Box>
    );
};

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`proveedores-tabpanel-${index}`}
            aria-labelledby={`proveedores-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ProveedoresModule = () => {
    const [value, setValue] = useState(0);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [refreshList, setRefreshList] = useState(false);
    const [banks, setBanks] = useState([]);
    const [isBankFormOpen, setIsBankFormOpen] = useState(false);
    const [refreshCompras, setRefreshCompras] = useState(false); // New state for refreshing purchases
    const [selectedSupplierForCompras, setSelectedSupplierForCompras] = useState(''); // New state for supplier selection in Compras tab

    const fetchSuppliers = async () => {
        try {
            const data = await api.list('/suppliers/');
            setSuppliers(data.results || (Array.isArray(data) ? data : []));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectSupplierForCompras = (event) => {
        setSelectedSupplierForCompras(event.target.value);
    };

    const fetchBanks = async () => {
        try {
            const data = await api.list('/banks/');
            setBanks(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error("Error fetching banks", err);
        }
    };

    useEffect(() => {
        fetchSuppliers();
        fetchBanks();
    }, [refreshList]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
        if (newValue !== 4) {
            setSelectedSupplier(null);
        }
    };

    const handleEditSupplier = (supplier) => {
        setSelectedSupplier(supplier);
        setValue(4); // Cambia a la pestaña del formulario de edicion
    };

    const handleNewPurchase = () => {
        setValue(5); // Cambia a la pestaña de nueva compra
    };

    const handleSelectSupplier = (supplier) => {
        setSelectedSupplier(supplier);
    };

    const handleCancel = () => {
        setSelectedSupplier(null);
        setValue(0); // Vuelve a la lista de proveedores
    };
    
    const handleCancelPurchase = () => {
        setValue(1); // Vuelve a la lista de compras
    };

    const handleSave = async (supplierData) => {
        try {
            if (supplierData.id) {
                await api.update('/suppliers/', supplierData.id, supplierData);
            } else {
                await api.create('/suppliers/', supplierData);
            }
            setRefreshList(prev => !prev);
            setValue(0);
            setSelectedSupplier(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveNewBank = async (bankData) => {
        try {
            await api.create('/banks/', bankData);
            setIsBankFormOpen(false);
            fetchBanks(); // Refresh the banks list
        } catch (err) {
            console.error("Error creating bank", err);
        }
    };

    const handlePurchaseSaveSuccess = () => {
        setRefreshCompras(prev => !prev); // Toggle to trigger refresh in ComprasProveedor
        setValue(1); // Switch to 'Compras' tab
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de proveedores">
                    <Tab label="Lista de Proveedores" id="proveedores-tab-0" />
                    <Tab label="Compras" id="proveedores-tab-1" />
                    <Tab label="Cuenta Corriente" id="proveedores-tab-2" />
                    <Tab label="Pagos" id="proveedores-tab-3" />
                    <Tab label="Nuevo/Editar Proveedor" id="proveedores-tab-4" />
                    <Tab label="Nueva Compra" id="proveedores-tab-5" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <SupplierList onEdit={handleEditSupplier} refresh={refreshList} />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Filtrar por Proveedor</InputLabel>
                    <Select
                        value={selectedSupplierForCompras}
                        onChange={handleSelectSupplierForCompras}
                        label="Filtrar por Proveedor"
                    >
                        <MenuItem value="">
                            <em>Todos los proveedores</em>
                        </MenuItem>
                        {suppliers.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <ComprasProveedor 
                    onNewPurchase={handleNewPurchase} 
                    refresh={refreshCompras} 
                    suppliers={suppliers} 
                    selectedSupplierId={selectedSupplierForCompras}
                />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <CuentaCorrienteProveedor />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <PagosProveedor />
            </TabPanel>
            <TabPanel value={value} index={4}>
                <SupplierForm 
                    onSave={handleSave} 
                    onCancel={handleCancel} 
                    supplier={selectedSupplier} 
                    suppliers={suppliers}
                    onSelectSupplier={handleSelectSupplier}
                    banks={banks}
                    onNewBank={() => setIsBankFormOpen(true)}
                />
            </TabPanel>
            <TabPanel value={value} index={5}>
                <NewPurchaseForm suppliers={suppliers} onCancel={handleCancelPurchase} onSaveSuccess={handlePurchaseSaveSuccess} />
            </TabPanel>

            <BankForm 
                open={isBankFormOpen} 
                onClose={() => setIsBankFormOpen(false)} 
                onSave={handleSaveNewBank} 
            />
        </Box>
    );
};

export default ProveedoresModule;