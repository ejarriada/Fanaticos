import React, { useState, useEffect } from 'react';
import { list } from '../../utils/api';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

const LoyaltyCardList = () => {
    const [loyaltyCards, setLoyaltyCards] = useState([]);

    useEffect(() => {
        const fetchLoyaltyCards = async () => {
            try {
                const data = await list('commercial/loyalty-cards/');
                setLoyaltyCards(data);
            } catch (error) {
                console.error('Error fetching loyalty cards:', error);
            }
        };

        fetchLoyaltyCards();
    }, []);

    return (
        <div>
            <h2>Lista de Tarjetas de Fidelidad</h2>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Número de Tarjeta</TableCell>
                            <TableCell>Nivel</TableCell>
                            <TableCell>Puntos</TableCell>
                            <TableCell>Fecha de Emisión</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loyaltyCards.map((card) => (
                            <TableRow key={card.id}>
                                <TableCell>{card.client}</TableCell>
                                <TableCell>{card.card_number}</TableCell>
                                <TableCell>{card.tier}</TableCell>
                                <TableCell>{card.points}</TableCell>
                                <TableCell>{new Date(card.issue_date).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default LoyaltyCardList;