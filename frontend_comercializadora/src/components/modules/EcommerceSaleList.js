import React, { useState, useEffect } from 'react';
import { list } from '../../utils/api';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

const EcommerceSaleList = () => {
    const [ecommerceSales, setEcommerceSales] = useState([]);

    useEffect(() => {
        const fetchEcommerceSales = async () => {
            try {
                const data = await list('commercial/ecommerce-sales/');
                setEcommerceSales(data);
            } catch (error) {
                console.error('Error fetching e-commerce sales:', error);
            }
        };

        fetchEcommerceSales();
    }, []);

    return (
        <div>
            <h2>Lista de Ventas E-commerce</h2>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID Venta</TableCell>
                            <TableCell>Plataforma</TableCell>
                            <TableCell>ID Pedido Plataforma</TableCell>
                            <TableCell>Almacén de Despacho</TableCell>
                            <TableCell>Estado de Envío</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ecommerceSales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell>{sale.sale}</TableCell>
                                <TableCell>{sale.platform}</TableCell>
                                <TableCell>{sale.platform_order_id}</TableCell>
                                <TableCell>{sale.dispatch_warehouse}</TableCell>
                                <TableCell>{sale.shipping_status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default EcommerceSaleList;