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

// User Form Dialog Component
const UserForm = ({ open, onClose, onSave, user, formData, setFormData, handleChange }) => {
    const [systemRoles, setSystemRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [rolesError, setRolesError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setLoadingRoles(true);
                const data = await api.list('/system-roles/');
                const roleList = Array.isArray(data) ? data : data.results;
                setSystemRoles(roleList || []);
            } catch (err) {
                setRolesError('Error al cargar los roles del sistema.');
                console.error(err);
            } finally {
                setLoadingRoles(false);
            }
        };

        if (tenantId) {
            fetchRoles();
        }
    }, [tenantId]);

    const handleRoleChange = (e) => {
        const { value } = e.target;
        setFormData({ ...formData, roles: typeof value === 'string' ? value.split(',') : value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingRoles) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (rolesError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">{rolesError}</Alert></DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="email" label="Email" type="email" fullWidth value={formData.email || ''} onChange={handleChange} autoComplete="off" />
                {!user && (
                    <TextField margin="dense" name="password" label="Contraseña" type="password" fullWidth value={formData.password || ''} onChange={handleChange} autoComplete="new-password" />
                )}
                <TextField margin="dense" name="first_name" label="Nombre" type="text" fullWidth value={formData.first_name || ''} onChange={handleChange} />
                <TextField margin="dense" name="last_name" label="Apellido" type="text" fullWidth value={formData.last_name || ''} onChange={handleChange} />
                
                <TextField
                    margin="dense"
                    name="roles"
                    label="Roles"
                    select
                    SelectProps={{
                        multiple: true,
                        value: formData.roles || [],
                        onChange: handleRoleChange,
                    }}
                    fullWidth
                >
                    {systemRoles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                            {role.name}
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

// Main User Management Component
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        roles: [],
    });
    const { tenantId } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.list('/users/');
            const userList = Array.isArray(data) ? data : data.results;
            setUsers(userList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los usuarios. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchUsers();
        }
    }, [tenantId]);

    const handleOpenForm = (user = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                ...user,
                roles: user.roles ? user.roles.map(role => role.id) : [],
            });
        } else {
            setSelectedUser(null);
            setFormData({
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                roles: [],
            });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedUser(null);
        setIsFormOpen(false);
    };

    const handleSave = async (userData) => {
        try {
            const dataToSend = {
                ...userData,
                roles: userData.roles || [],
            };

            if (selectedUser) {
                await api.update('/users/', selectedUser.id, dataToSend);
            } else {
                await api.create('/users/', dataToSend);
            }
            fetchUsers(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el usuario.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
            try {
                await api.remove('/users/', id);
                fetchUsers(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el usuario.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Usuarios</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Usuario
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Apellido</TableCell>
                                <TableCell>Roles</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.first_name}</TableCell>
                                    <TableCell>{user.last_name}</TableCell>
                                    <TableCell>{user.roles.map(role => role.name).join(', ')}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(user)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(user.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <UserForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                user={selectedUser} 
                formData={formData}
                setFormData={setFormData}
                handleChange={handleChange}
            />
        </Box>
    );
};

export default UserManagement;
