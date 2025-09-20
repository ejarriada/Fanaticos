import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ProductionVolumeChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => `${item.product_design__name} (${item.op_type})`),
        datasets: [
            {
                label: 'Total Quantity',
                data: data.map(item => item.total_quantity),
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
                text: 'Production Volume by Product and Type',
            },
        },
    };

    return <Bar data={chartData} options={options} />;
};

export default ProductionVolumeChart;
