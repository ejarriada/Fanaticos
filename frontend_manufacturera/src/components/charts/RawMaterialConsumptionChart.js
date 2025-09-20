import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RawMaterialConsumptionChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => item.raw_materials_consumed__name),
        datasets: [
            {
                label: 'Total Consumed',
                data: data.map(item => item.total_consumed),
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
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
                text: 'Raw Material Consumption',
            },
        },
    };

    return <Bar data={chartData} options={options} />;
};

export default RawMaterialConsumptionChart;
