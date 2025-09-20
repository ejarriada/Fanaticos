import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DefectiveRateChart = ({ data }) => {
    const chartData = {
        labels: ['Defective Rate'],
        datasets: [
            {
                label: 'Defective Rate (%)',
                data: [data.defective_rate],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
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
                text: 'Defective Products Rate',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Defective Rate (%)'
                }
            }
        }
    };

    return <Bar data={chartData} options={options} />;
};

export default DefectiveRateChart;
