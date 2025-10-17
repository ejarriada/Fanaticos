import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const CommercialProductList = ({ products, onEdit, onDelete }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>SKU</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Marca</TableCell>
                        <TableCell>Categoría</TableCell>
                        <TableCell>Precio</TableCell>
                        <TableCell>Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.brand}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>{product.sale_price}</TableCell>
                            <TableCell>
                                <IconButton onClick={() => onEdit(product)}><EditIcon /></IconButton>
                                <IconButton onClick={() => onDelete(product.id)}><DeleteIcon /></IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default CommercialProductList;
