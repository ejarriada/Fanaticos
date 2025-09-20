import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { fetchSalesVolume, fetchInventoryTurnoverRate, fetchSupplierPerformance } from '../utils/api';
import SalesVolumeChart from './charts/SalesVolumeChart';
import InventoryTurnoverChart from './charts/InventoryTurnoverChart';
import SupplierPerformanceChart from './charts/SupplierPerformanceChart';

const TradingDashboard = () => {
    const [salesVolumeData, setSalesVolumeData] = useState([]);
    const [inventoryTurnoverRateData, setInventoryTurnoverRateData] = useState({});
    const [supplierPerformanceData, setSupplierPerformanceData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // For now, hardcode tenantId. In a real app, this would come from auth context.
    const tenantId = 1; 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [svData, itrData, spData] = await Promise.all([
                    fetchSalesVolume(tenantId),
                    fetchInventoryTurnoverRate(tenantId),
                    fetchSupplierPerformance(tenantId),
                ]);
                setSalesVolumeData(svData);
                setInventoryTurnoverRateData(itrData);
                setSupplierPerformanceData(spData);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenantId]);

    if (loading) return <div>Loading Trading Dashboard...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <>
            <div className="trading-dashboard">
            <h1>Trading Dashboard</h1>
            <div className="chart-container">
                <SalesVolumeChart data={salesVolumeData} />
            </div>
            <div className="chart-container">
                <InventoryTurnoverChart data={inventoryTurnoverRateData} />
            </div>
            <div className="chart-container">
                <SupplierPerformanceChart data={supplierPerformanceData} />
            </div>
        </div>
        </>
    );
};

export default TradingDashboard;
