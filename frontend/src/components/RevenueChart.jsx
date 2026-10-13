import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
);

const RevenueChart = () => {
  const data = {
    labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],

    datasets: [
      {
        label: "Revenue",
        data: [85000, 102000, 94000, 118000, 110000, 124500],
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 30,
        pointHoverRadius: 5,
        borderColor: "#7c3aed",
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            return "₹" + context.parsed.y.toLocaleString("en-IN");
          },
        },
      },
    },

    layout: {
      padding: {
        left: 5,
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },
      },

      y: {
        border: {
          display: false,
        },

        grid: {
          color: "#eeeeee",
        },

        ticks: {
          callback: (value) => {
            return "₹" + value.toLocaleString("en-IN");
          },
        },
      },
    },
  };
  return <Line data={data} options={options} />;
};

export default RevenueChart;
