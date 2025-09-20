import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SupplierPerformanceChart = ({ data }) => {
    const chartData = {
        labels: ['On-time Delivery Rate'],
        datasets: [
            {
                label: 'On-time Delivery Rate (%)',
                data: [data.on_time_delivery_rate],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
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
                text: 'Supplier Performance (On-time Delivery Rate)',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'On-time Delivery Rate (%)'
                }
            }
        }
    };

    return <Bar data={chartData} options={options} />;
};

export default SupplierPerformanceChart;
