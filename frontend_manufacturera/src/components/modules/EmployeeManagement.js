import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem,
    Grid, Divider, Chip, FormControl, InputLabel, Select
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Component for managing dependents (familiares a cargo)
const DependentsManager = ({ dependents, onChange }) => {
    const [localDependents, setLocalDependents] = useState(dependents || []);
    const [isAddingDependent, setIsAddingDependent] = useState(false);
    const [newDependent, setNewDependent] = useState({ name: '', dni: '', relationship: '' });

    useEffect(() => {
        setLocalDependents(dependents || []);
    }, [dependents]);

    const handleAddDependent = () => {
        if (newDependent.name && newDependent.dni && newDependent.relationship) {
            const updated = [...localDependents, newDependent];
            setLocalDependents(updated);
            onChange(updated);
            setNewDependent({ name: '', dni: '', relationship: '' });
            setIsAddingDependent(false);
        }
    };

    const handleRemoveDependent = (index) => {
        const updated = localDependents.filter((_, i) => i !== index);
        setLocalDependents(updated);
        onChange(updated);
    };

    return (
        <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Familiares a Cargo</Typography>
            
            {localDependents.map((dep, index) => (
                <Chip
                    key={index}
                    label={`${dep.name} (${dep.relationship}) - DNI: ${dep.dni}`}
                    onDelete={() => handleRemoveDependent(index)}
                    sx={{ m: 0.5 }}
                />
            ))}

            {!isAddingDependent ? (
                <Button
                    startIcon={<AddIcon />}
                    onClick={() => setIsAddingDependent(true)}
                    size="small"
                    sx={{ mt: 1 }}
                >
                    Agregar Familiar
                </Button>
            ) : (
                <Box sx={{ mt: 1, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Nombre"
                                value={newDependent.name}
                                onChange={(e) => setNewDependent({ ...newDependent, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="DNI"
                                value={newDependent.dni}
                                onChange={(e) => setNewDependent({ ...newDependent, dni: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Parentesco"
                                value={newDependent.relationship}
                                onChange={(e) => setNewDependent({ ...newDependent, relationship: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 1 }}>
                        <Button size="small" onClick={handleAddDependent} variant="contained" sx={{ mr: 1 }}>
                            Guardar
                        </Button>
                        <Button size="small" onClick={() => setIsAddingDependent(false)}>
                            Cancelar
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// Employee Form Dialog Component
const EmployeeForm = ({ open, onClose, onSave, employee }) => {
    const [formData, setFormData] = useState({});
    const [users, setUsers] = useState([]);
    const [factories, setFactories] = useState([]);
    const [employeeRoles, setEmployeeRoles] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [dependenciesError, setDependenciesError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [usersData, factoriesData, employeeRolesData] = await Promise.all([
                    api.list('/users/'),
                    api.list('/factories/'),
                    api.list('/employee-roles/'),
                ]);
                setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
                setFactories(Array.isArray(factoriesData) ? factoriesData : factoriesData.results || []);
                setEmployeeRoles(Array.isArray(employeeRolesData) ? employeeRolesData : employeeRolesData.results || []);
            } catch (err) {
                setDependenciesError('Error al cargar dependencias (usuarios, fábricas, roles).');
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
        if (employee) {
            setFormData({
                ...employee,
                hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
                birth_date: employee.birth_date ? new Date(employee.birth_date).toISOString().split('T')[0] : '',
                user: employee.user?.id || '',
                factory: employee.factory?.id || '',
                role: employee.role?.id || '',
                dependents: employee.dependents || [],
            });
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                dni: '',
                cuil: '',
                birth_date: '',
                address: '',
                phone: '',
                dependents: [],
                observations: '',
                user: '',
                factory: '',
                role: '',
                hire_date: new Date().toISOString().split('T')[0],
            });
        }
    }, [employee, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDependentsChange = (dependents) => {
        setFormData({ ...formData, dependents });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingDependencies) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (dependenciesError) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">{dependenciesError}</Alert></DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{employee ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {/* Datos Personales */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Datos Personales</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="dense"
                                name="first_name"
                                label="Nombre *"
                                fullWidth
                                value={formData.first_name || ''}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="dense"
                                name="last_name"
                                label="Apellido *"
                                fullWidth
                                value={formData.last_name || ''}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="dense"
                                name="dni"
                                label="DNI *"
                                fullWidth
                                value={formData.dni || ''}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="dense"
                                name="cuil"
                                label="CUIL *"
                                fullWidth
                                value={formData.cuil || ''}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="dense"
                                name="birth_date"
                                label="Fecha de Nacimiento *"
                                type="date"
                                fullWidth
                                value={formData.birth_date || ''}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="dense"
                                name="phone"
                                label="Teléfono *"
                                fullWidth
                                value={formData.phone || ''}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                margin="dense"
                                name="address"
                                label="Domicilio *"
                                fullWidth
                                value={formData.address || ''}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Datos Laborales */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Datos Laborales</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="dense" required sx={{ minWidth: 250 }}>
                                <InputLabel>Fábrica *</InputLabel>
                                <Select
                                    name="factory"
                                    value={formData.factory || ''}
                                    onChange={handleChange}
                                    label="Fábrica *"
                                >
                                    {factories.map((factory) => (
                                        <MenuItem key={factory.id} value={factory.id}>
                                            {factory.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="dense" required sx={{ minWidth: 250 }}>
                                <InputLabel>Rol de Empleado *</InputLabel>
                                <Select
                                    name="role"
                                    value={formData.role || ''}
                                    onChange={handleChange}
                                    label="Rol de Empleado *"
                                >
                                    {employeeRoles.map((role) => (
                                        <MenuItem key={role.id} value={role.id}>
                                            {role.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                margin="dense"
                                name="hire_date"
                                label="Fecha de Contratación *"
                                type="date"
                                fullWidth
                                value={formData.hire_date || ''}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="dense" sx={{ minWidth: 250 }}>
                                <InputLabel>Usuario del Sistema (opcional)</InputLabel>
                                <Select
                                    name="user"
                                    value={formData.user || ''}
                                    onChange={handleChange}
                                    label="Usuario del Sistema (opcional)"
                                >
                                    <MenuItem value="">
                                        <em>Sin usuario asignado</em>
                                    </MenuItem>
                                    {users.map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.email}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Familiares a Cargo */}
                    <DependentsManager 
                        dependents={formData.dependents || []}
                        onChange={handleDependentsChange}
                    />

                    <Divider sx={{ my: 3 }} />

                    {/* Observaciones */}
                    <TextField
                        margin="dense"
                        name="observations"
                        label="Observaciones"
                        multiline
                        rows={4}
                        fullWidth
                        value={formData.observations || ''}
                        onChange={handleChange}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained">Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Employee Management Component
const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const { tenantId } = useAuth();

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await api.list('/employees/');
            const employeeList = Array.isArray(data) ? data : data.results;
            setEmployees(employeeList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los empleados. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchEmployees();
        }
    }, [tenantId]);

    const handleOpenForm = (employee = null) => {
        setSelectedEmployee(employee);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedEmployee(null);
        setIsFormOpen(false);
    };

    const handleSave = async (employeeData) => {
        try {
            const dataToSend = {
                ...employeeData,
                user: employeeData.user || null,
                factory: employeeData.factory || null,
                role: employeeData.role || null,
            };

            if (selectedEmployee) {
                await api.update('/employees/', selectedEmployee.id, dataToSend);
            } else {
                await api.create('/employees/', dataToSend);
            }
            fetchEmployees();
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el empleado.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este empleado?')) {
            try {
                await api.remove('/employees/', id);
                fetchEmployees();
            } catch (err) {
                setError('Error al eliminar el empleado.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Empleado
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Apellido</TableCell>
                                <TableCell>DNI</TableCell>
                                <TableCell>Fábrica</TableCell>
                                <TableCell>Rol</TableCell>
                                <TableCell>Fecha de Contratación</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>{employee.first_name}</TableCell>
                                    <TableCell>{employee.last_name}</TableCell>
                                    <TableCell>{employee.dni}</TableCell>
                                    <TableCell>{employee.factory_name || employee.factory}</TableCell>
                                    <TableCell>{employee.role_name || employee.role}</TableCell>
                                    <TableCell>{employee.hire_date}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(employee)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(employee.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <EmployeeForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                employee={selectedEmployee} 
            />
        </Box>
    );
};

export default EmployeeManagement;