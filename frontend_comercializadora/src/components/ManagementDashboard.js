import React, { useState, useEffect } from 'react';
import { fetchOverallProfitLoss, fetchCurrentBalance, fetchRevenueExpenses } from '../utils/api';
import OverallProfitLossChart from './charts/OverallProfitLossChart';
import CurrentBalanceChart from './charts/CurrentBalanceChart';
import RevenueExpensesChart from './charts/RevenueExpensesChart';
import ProjectedGrowthChart from './charts/ProjectedGrowthChart';

const ManagementDashboard = () => {
    const [overallProfitLossData, setOverallProfitLossData] = useState({});
    const [currentBalanceData, setCurrentBalanceData] = useState({});
    const [revenueExpensesData, setRevenueExpensesData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // For now, hardcode tenantId. In a real app, this would come from auth context.
    const tenantId = 1; 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [oplData, cbData, reData] = await Promise.all([
                    fetchOverallProfitLoss(tenantId),
                    fetchCurrentBalance(tenantId),
                    fetchRevenueExpenses(tenantId),
                ]);
                setOverallProfitLossData(oplData);
                setCurrentBalanceData(cbData);
                setRevenueExpensesData(reData);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenantId]);

    if (loading) return <div>Cargando Dashboard de Gestión...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="management-dashboard">
            <h1>Dashboard de Gestión</h1>
            <div className="chart-container">
                <OverallProfitLossChart data={overallProfitLossData} />
            </div>
            <div className="chart-container">
                <CurrentBalanceChart data={currentBalanceData} />
            </div>
            <div className="chart-container">
                <RevenueExpensesChart data={revenueExpensesData} />
            </div>
            <div className="chart-container">
                <ProjectedGrowthChart tenantId={tenantId} dataType="production" title="Crecimiento Proyectado de Producción" />
            </div>
            <div className="chart-container">
                <ProjectedGrowthChart tenantId={tenantId} dataType="sales" title="Crecimiento Proyectado de Ventas" />
            </div>
            <div className="chart-container">
                <ProjectedGrowthChart tenantId={tenantId} dataType="financial" title="Crecimiento Proyectado Financiero" />
            </div>
        </div>
    );
};

export default ManagementDashboard;
