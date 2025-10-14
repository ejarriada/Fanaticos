import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Salary Form Dialog Component
const SalaryForm = ({ open, onClose, onSave, salary }) => {
    const [formData, setFormData] = useState({});
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [employeesError, setEmployeesError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoadingEmployees(true);
                const data = await api.list('/employees/');
                const employeeList = Array.isArray(data) ? data : data.results;
                setEmployees(employeeList || []);
            } catch (err) {
                setEmployeesError('Error al cargar los empleados.');
                console.error(err);
            } finally {
                setLoadingEmployees(false);
            }
        };

        if (tenantId) {
            fetchEmployees();
        }
    }, [tenantId]);

    useEffect(() => {
        if (salary) {
            setFormData({
                id: salary.id,
                employee: salary.employee?.id || salary.employee || '',
                amount: salary.amount || '',
                pay_date: salary.pay_date ? new Date(salary.pay_date).toISOString().split('T')[0] : '',
            });
        } else {
            setFormData({
                employee: '',
                amount: '',
                pay_date: new Date().toISOString().split('T')[0],
            });
        }
    }, [salary, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingEmployees) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (employeesError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">{employeesError}</Alert></DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{salary ? 'Editar Salario' : 'Nuevo Salario'}</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    name="employee"
                    label="Empleado"
                    select
                    fullWidth
                    value={formData.employee || ''}
                    onChange={handleChange}
                >
                    {employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                            {`${employee.first_name} ${employee.last_name}`}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="amount" label="Monto" type="number" fullWidth value={formData.amount || ''} onChange={handleChange} />
                <TextField margin="dense" name="pay_date" label="Fecha de Pago" type="date" fullWidth value={formData.pay_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Salary Management Component
const SalaryManagement = () => {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const { tenantId } = useAuth();

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const data = await api.list('/salaries/');
            const salaryList = Array.isArray(data) ? data : data.results;
            setSalaries(salaryList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los salarios. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchSalaries();
        }
    }, [tenantId]);

    const handleOpenForm = (salary = null) => {
        setSelectedSalary(salary);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedSalary(null);
        setIsFormOpen(false);
    };

    const handleSave = async (salaryData) => {
        try {
            const dataToSend = {
                ...salaryData,
                employee: salaryData.employee || null,
            };

            if (selectedSalary) {
                await api.update('/salaries/', selectedSalary.id, dataToSend);
            } else {
                await api.create('/salaries/', dataToSend);
            }
            fetchSalaries(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el salario.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este salario?')) {
            try {
                await api.remove('/salaries/', id);
                fetchSalaries(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el salario.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Salario
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Empleado</TableCell>
                                <TableCell>Monto</TableCell>
                                <TableCell>Fecha de Pago</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {salaries.map((salary) => (
                                <TableRow key={salary.id}>
                                    <TableCell>{salary.employee_name || salary.employee}</TableCell>
                                    <TableCell>{salary.amount}</TableCell>
                                    <TableCell>{salary.pay_date}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(salary)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(salary.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <SalaryForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                salary={selectedSalary} 
            />
        </Box>
    );
};

export default SalaryManagement;
