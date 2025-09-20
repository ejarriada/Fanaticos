import React, { useState, useEffect } from 'react';
import { fetchProductionVolume, fetchProcessCompletionRate, fetchRawMaterialConsumption, fetchDefectiveProductsRate } from '../utils/api';
import ProductionVolumeChart from './charts/ProductionVolumeChart';
import ProcessCompletionChart from './charts/ProcessCompletionChart';
import RawMaterialConsumptionChart from './charts/RawMaterialConsumptionChart';
import DefectiveRateChart from './charts/DefectiveRateChart';

const ManufacturingDashboard = () => {
    const [productionVolumeData, setProductionVolumeData] = useState([]);
    const [processCompletionData, setProcessCompletionData] = useState([]);
    const [rawMaterialConsumptionData, setRawMaterialConsumptionData] = useState([]);
    const [defectiveProductsRateData, setDefectiveProductsRateData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // For now, hardcode tenantId. In a real app, this would come from auth context.
    const tenantId = 1; 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pvData, pcData, rmcData, dprData] = await Promise.all([
                    fetchProductionVolume(tenantId),
                    fetchProcessCompletionRate(tenantId),
                    fetchRawMaterialConsumption(tenantId),
                    fetchDefectiveProductsRate(tenantId),
                ]);
                setProductionVolumeData(pvData);
                setProcessCompletionData(pcData);
                setRawMaterialConsumptionData(rmcData);
                setDefectiveProductsRateData(dprData);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenantId]);

    if (loading) return <div>Loading Manufacturing Dashboard...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="manufacturing-dashboard">
            <h1>Manufacturing Dashboard</h1>
            <div className="chart-container">
                <ProductionVolumeChart data={productionVolumeData} />
            </div>
            <div className="chart-container">
                <ProcessCompletionChart data={processCompletionData} />
            </div>
            <div className="chart-container">
                <RawMaterialConsumptionChart data={rawMaterialConsumptionData} />
            </div>
            <div className="chart-container">
                <DefectiveRateChart data={defectiveProductsRateData} />
            </div>
        </div>
    );
};

export default ManufacturingDashboard;
