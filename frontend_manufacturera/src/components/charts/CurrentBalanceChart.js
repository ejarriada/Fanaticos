import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CurrentBalanceChart = ({ data }) => {
    const accountLabels = data.account_balances.map(item => item.account__name);
    const accountBalances = data.account_balances.map(item => item.balance);

    const cashRegisterLabels = data.cash_register_balances.map(item => item.cash_register__name);
    const cashRegisterBalances = data.cash_register_balances.map(item => item.balance);

    const accountChartData = {
        labels: accountLabels,
        datasets: [
            {
                label: 'Account Balance',
                data: accountBalances,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    const cashRegisterChartData = {
        labels: cashRegisterLabels,
        datasets: [
            {
                label: 'Cash Register Balance',
                data: cashRegisterBalances,
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
                text: 'Current Balance',
            },
        },
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: 'Balance'
                }
            }
        }
    };

    return (
        <div>
            <h3>Account Balances</h3>
            <Bar data={accountChartData} options={options} />
            <h3>Cash Register Balances</h3>
            <Bar data={cashRegisterChartData} options={options} />
        </div>
    );
};

export default CurrentBalanceChart;
