import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function MaterialsChart({ stats }) {
  const data = {
    labels: ['Total', 'Available', 'Unavailable', 'Low Stock'],
    datasets: [
      {
        label: 'Materials',
        data: [stats.total, stats.available, stats.unavailable, stats.lowStock],
        backgroundColor: ['#18207A', '#2ecc71', '#e74c3c', '#f39c12'],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Materials Overview', font: { size: 18 } },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return <Bar data={data} options={options} />;
}

export default MaterialsChart;
