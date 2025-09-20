import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, FormControl, InputLabel, Select, 
    MenuItem, Button, TextField, Grid
} from '@mui/material';
import * as api from '../../utils/api';

const CuentaPorCliente = () => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newMovement, setNewMovement] = useState({
        description: '',
        type: 'Cobro',
        amount: ''
    });
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState('');

    useEffect(() => {
        const fetchClientsAndAccounts = async () => {
            try {
                setLoading(true);
                const [clientsData, accountsData] = await Promise.all([
                    api.list('/clients/'),
                    api.list('/accounts/')
                ]);
                setClients(clientsData || []);
                setAccounts(accountsData || []);
                if (accountsData && accountsData.length > 0) {
                    setSelectedAccount(accountsData[0].id);
                }
            } catch (error) {
                console.error("Error fetching initial data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClientsAndAccounts();
    }, []);

    const fetchMovements = async () => {
        if (selectedClient) {
            try {
                const data = await api.list(`/transactions/?related_sale__client_id=${selectedClient}`);
                let balance = 0;
                const movementsWithBalance = data.map(mov => {
                    balance += parseFloat(mov.amount);
                    return { ...mov, balance };
                });
                setMovements(movementsWithBalance.reverse() || []);
            } catch (error) {
                console.error("Error fetching movements", error);
            }
        } else {
            setMovements([]);
        }
    };

    useEffect(() => {
        fetchMovements();
    }, [selectedClient]);

    const handleClientChange = (event) => {
        setSelectedClient(event.target.value);
    };

    const handleMovementChange = (event) => {
        setNewMovement({
            ...newMovement,
            [event.target.name]: event.target.value
        });
    };

    const handleMovementSubmit = async (event) => {
        event.preventDefault();
        if (!selectedAccount) {
            console.error("No account selected");
            return;
        }

        const amount = parseFloat(newMovement.amount) * (newMovement.type === 'Venta' ? -1 : 1);

        const movementData = {
            description: newMovement.description,
            amount: amount,
            account: selectedAccount,
        };

        try {
            await api.create('/transactions/', movementData);
            setNewMovement({ description: '', type: 'Cobro', amount: '' });
            setShowForm(false);
            fetchMovements(); // Refresh movements list
        } catch (error) {
            console.error("Error creating transaction", error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Cuenta Corriente por Cliente</Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Seleccionar Cliente</InputLabel>
                <Select
                    value={selectedClient}
                    label="Seleccionar Cliente"
                    onChange={handleClientChange}
                    disabled={loading}
                >
                    <MenuItem value=""><em>Seleccione un cliente</em></MenuItem>
                    {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {selectedClient && (
                <>
                    <Button variant="contained" sx={{ mb: 2 }} onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancelar' : 'Agregar Movimiento'}
                    </Button>

                    {showForm && (
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Nuevo Movimiento</Typography>
                            <Box component="form" onSubmit={handleMovementSubmit}>
                                <Grid container spacing={2}>
                                    <Grid xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Detalle"
                                            name="description"
                                            value={newMovement.description}
                                            onChange={handleMovementChange}
                                            required
                                        />
                                    </Grid>
                                    <Grid xs={6} sm={3}>
                                        <FormControl fullWidth>
                                            <InputLabel>Tipo</InputLabel>
                                            <Select
                                                name="type"
                                                value={newMovement.type}
                                                label="Tipo"
                                                onChange={handleMovementChange}
                                            >
                                                <MenuItem value="Cobro">Cobro</MenuItem>
                                                <MenuItem value="Venta">Venta</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid xs={6} sm={3}>
                                        <TextField
                                            fullWidth
                                            label="Monto"
                                            name="amount"
                                            type="number"
                                            value={newMovement.amount}
                                            onChange={handleMovementChange}
                                            required
                                        />
                                    </Grid>
                                    <Grid xs={12}>
                                        <Button type="submit" variant="contained" color="primary" disabled={!selectedAccount}>
                                            Guardar Movimiento
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    )}

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Detalle</TableCell>
                                    <TableCell>Tipo (Monto)</TableCell>
                                    <TableCell>Balance</TableCell>
                                    <TableCell>Usuario</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {movements.map((mov) => (
                                    <TableRow key={mov.id}>
                                        <TableCell>{new Date(mov.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{mov.description}</TableCell>
                                        <TableCell style={{ color: mov.amount >= 0 ? 'green' : 'red' }}>
                                            {mov.amount >= 0 ? 'Cobro' : 'Venta'}: ${Math.abs(mov.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell>${mov.balance.toFixed(2)}</TableCell>
                                        <TableCell>{mov.user || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};

export default CuentaPorCliente;
