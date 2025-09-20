import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OverallProfitLossChart = ({ data }) => {
    const chartData = {
        labels: ['Profit/Loss'],
        datasets: [
            {
                label: 'Overall Profit/Loss',
                data: [data.overall_profit_loss],
                backgroundColor: data.overall_profit_loss >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)',
                borderColor: data.overall_profit_loss >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)',
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
                text: 'Overall Profit/Loss',
            },
        },
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: 'Amount'
                }
            }
        }
    };

    return <Bar data={chartData} options={options} />;
};

export default OverallProfitLossChart;
