import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InventoryTurnoverChart = ({ data }) => {
    const chartData = {
        labels: ['Inventory Turnover Rate'],
        datasets: [
            {
                label: 'Turnover Rate',
                data: [data.inventory_turnover_rate],
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Inventory Turnover Rate',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Turnover Rate'
                }
            }
        }
    };

    return <Bar data={chartData} options={options} />;
};

export default InventoryTurnoverChart;
