import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadarController,
  RadialLinearScale,
  Filler,
  BubbleController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './ChartJSEnhanced.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadarController,
  RadialLinearScale,
  Filler,
  BubbleController
);

// Radar Chart for Technical Indicators
const RadarChartComponent = ({ analysis }) => {
  if (!analysis) return null;

  const data = {
    labels: ['Price', 'Volatility', 'Trend Power', 'Risk', 'Momentum'],
    datasets: [
      {
        label: 'Technical Score',
        data: [
          (analysis.latest_price / analysis['52_week_high']) * 100,
          Math.min(analysis.volatility_pct * 2, 100),
          analysis.trend === 'Uptrend' ? 75 : 25,
          analysis.risk_level === 'Low' ? 25 : analysis.risk_level === 'Medium' ? 50 : 75,
          50,
        ],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        borderWidth: 2,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 600,
          },
          color: '#4a5568',
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Technical Indicators Radar',
        font: {
          size: 16,
          weight: 700,
        },
        color: '#2d3748',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(45, 55, 72, 0.95)',
        titleFont: { size: 12, weight: 600 },
        bodyFont: { size: 12 },
        padding: 12,
        borderRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed.r.toFixed(1)}%`,
        },
      },
    },
    scale: {
      beginAtZero: true,
      max: 100,
      ticks: {
        color: '#a0aec0',
        font: {
          size: 11,
        },
        stepSize: 25,
      },
      grid: {
        color: 'rgba(226, 232, 240, 0.5)',
      },
    },
  };

  return (
    <div className="chartjs-wrapper">
      <Chart type="radar" data={data} options={options} height={300} />
    </div>
  );
};

// Bubble Chart - Price vs Volatility
const BubbleChartComponent = ({ data }) => {
  if (!data || data.length === 0) return null;

  const bubbleData = data.map((item) => ({
    x: item.daily_return_pct || 0,
    y: item.close,
    r: 8 + Math.abs(item.daily_return_pct || 0) * 3,
  }));

  const chartData = {
    datasets: [
      {
        label: 'Price vs Return',
        data: bubbleData,
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: '#667eea',
        borderWidth: 2,
        hoverBackgroundColor: '#764ba2',
        hoverBorderColor: '#764ba2',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          font: { size: 12, weight: 600 },
          color: '#4a5568',
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Price vs Daily Return (Bubble Size = Volatility)',
        font: { size: 14, weight: 700 },
        color: '#2d3748',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(45, 55, 72, 0.95)',
        padding: 12,
        borderRadius: 8,
        titleFont: { size: 12, weight: 600 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) =>
            `Price: $${context.raw.y.toFixed(2)}, Return: ${context.raw.x.toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Daily Return (%)',
          font: { size: 12, weight: 600 },
          color: '#4a5568',
        },
        ticks: {
          color: '#a0aec0',
          callback: (value) => value.toFixed(1) + '%',
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.3)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price ($)',
          font: { size: 12, weight: 600 },
          color: '#4a5568',
        },
        ticks: {
          color: '#a0aec0',
          callback: (value) => '$' + value.toFixed(0),
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.3)',
        },
      },
    },
  };

  return (
    <div className="chartjs-wrapper">
      <Chart type="bubble" data={chartData} options={options} height={300} />
    </div>
  );
};

// Combo Chart - Combined Line & Bar
const ComboChartComponent = ({ data }) => {
  if (!data || data.length === 0) return null;

  const labels = data.map((item) =>
    new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  const priceData = data.map((item) => item.close);
  const returnData = data.map((item) => item.daily_return_pct || 0);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'Close Price ($)',
        data: priceData,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.05)',
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        type: 'bar',
        label: 'Daily Return (%)',
        data: returnData,
        backgroundColor: returnData.map((val) => (val >= 0 ? '#10b981' : '#ef4444')),
        borderRadius: 4,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          font: { size: 12, weight: 600 },
          color: '#4a5568',
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Price & Daily Returns Combination',
        font: { size: 14, weight: 700 },
        color: '#2d3748',
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(45, 55, 72, 0.95)',
        padding: 12,
        borderRadius: 8,
        titleFont: { size: 12, weight: 600 },
      },
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Price ($)',
          font: { size: 11, weight: 600 },
          color: '#667eea',
        },
        ticks: { color: '#a0aec0' },
        grid: { color: 'rgba(226, 232, 240, 0.3)' },
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Return (%)',
          font: { size: 11, weight: 600 },
          color: '#f59e0b',
        },
        ticks: {
          color: '#a0aec0',
          callback: (value) => value.toFixed(1) + '%',
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="chartjs-wrapper">
      <Chart type="bar" data={chartData} options={options} height={300} />
    </div>
  );
};

// Box Plot Style Chart - Price Distribution
const PriceDistributionChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const prices = data.map((item) => item.close);
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const chartData = {
    labels: ['Price Distribution'],
    datasets: [
      {
        label: 'Close Price Range',
        data: [
          {
            x: 0,
            y: [min, q1, median, q3, max],
          },
        ],
        backgroundColor: 'rgba(102, 126, 234, 0.3)',
        borderColor: '#667eea',
        borderWidth: 2,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  return (
    <div className="price-distribution-chart">
      <h4>Price Distribution Statistics</h4>
      <div className="stats-grid">
        <div className="stat">
          <span className="label">Min:</span>
          <span className="value">${min.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="label">Q1 (25%):</span>
          <span className="value">${q1.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="label">Median:</span>
          <span className="value">${median.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="label">Q3 (75%):</span>
          <span className="value">${q3.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="label">Max:</span>
          <span className="value">${max.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="label">Range:</span>
          <span className="value">${(max - min).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export { RadarChartComponent, BubbleChartComponent, ComboChartComponent, PriceDistributionChart };
