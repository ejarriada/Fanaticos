import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ProcessCompletionChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => item.process_name),
        datasets: [
            {
                label: 'Completion Rate (%)',
                data: data.map(item => item.completion_rate),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
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
                text: 'Process Completion Rate',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Completion Rate (%)'
                }
            }
        }
    };

    return <Bar data={chartData} options={options} />;
};

export default ProcessCompletionChart;
