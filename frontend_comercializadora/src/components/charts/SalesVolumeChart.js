import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SalesVolumeChart = ({ data }) => {
    const labels = data.map(item => {
        let label = item.local__name;
        if (item.is_ecommerce_sale) {
            label += ` (e-commerce: ${item.ecommerce_platform})`;
        }
        return label;
    });

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Total Sales',
                data: data.map(item => item.total_sales),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
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
                text: 'Sales Volume by Local/Platform',
            },
        },
    };

    return <Bar data={chartData} options={options} />;
};

export default SalesVolumeChart;
