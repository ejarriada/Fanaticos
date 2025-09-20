import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchProjectedGrowth } from '../../utils/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const ProjectedGrowthChart = ({ tenantId, dataType, title }) => {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Default historical period for projection calculation
    const defaultHistoricalStartDate = '2024-01-01';
    const defaultHistoricalEndDate = '2024-12-31';

    // Default projection period
    const defaultProjectionStartDate = '2025-01-01';
    const defaultProjectionEndDate = '2025-12-31';

    useEffect(() => {
        const getProjectedData = async () => {
            try {
                setLoading(true);
                const data = await fetchProjectedGrowth(
                    tenantId,
                    dataType,
                    defaultHistoricalStartDate,
                    defaultHistoricalEndDate,
                    defaultProjectionStartDate,
                    defaultProjectionEndDate
                );

                setChartData({
                    labels: data.map(item => item.date),
                    datasets: [
                        {
                            label: title,
                            data: data.map(item => item.value),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                        },
                    ],
                });
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (tenantId && dataType) {
            getProjectedData();
        }
    }, [tenantId, dataType, title]);

    if (loading) return <div>Cargando datos de {title}...</div>;
    if (error) return <div>Error al cargar datos de {title}: {error.message}</div>;

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: title,
            },
        },
    };

    return (
        <div className="chart-container">
            <Line data={chartData} options={options} />
        </div>
    );
};

export default ProjectedGrowthChart;
