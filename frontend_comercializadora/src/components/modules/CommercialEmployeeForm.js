import React, { useState, useEffect } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    MenuItem, FormControl, InputLabel, Select, Grid
} from '@mui/material';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CommercialEmployeeForm = ({ open, onClose, onSave, employee }) => {
    const [formData, setFormData] = useState({});
    const [users, setUsers] = useState([]);
    const [locals, setLocals] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [usersData, localsData] = await Promise.all([
                    api.list('/users/'),
                    api.list('/locals/'),
                ]);
                setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
                setLocals(Array.isArray(localsData) ? localsData : localsData.results || []);
            } catch (err) {
                console.error('Error fetching dependencies', err);
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
                user: employee.user?.id || '',
                local: employee.local?.id || '',
                role: employee.role || '',
            });
        } else {
            setFormData({
                user: '',
                local: '',
                role: '',
            });
        }
    }, [employee, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingDependencies) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent>Cargando usuarios y locales...</DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{employee ? 'Editar Empleado Comercial' : 'Nuevo Empleado Comercial'}</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Usuario</InputLabel>
                    <Select name="user" value={formData.user || ''} onChange={handleChange} label="Usuario">
                        {users.map(user => (
                            <MenuItem key={user.id} value={user.id}>{user.email}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Local</InputLabel>
                    <Select name="local" value={formData.local || ''} onChange={handleChange} label="Local">
                        {locals.map(local => (
                            <MenuItem key={local.id} value={local.id}>{local.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField margin="dense" name="role" label="Rol" type="text" fullWidth value={formData.role || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CommercialEmployeeForm;
