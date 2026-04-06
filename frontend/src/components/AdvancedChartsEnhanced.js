import React from 'react';
import ReactApexChart from 'react-apexcharts';
import './AdvancedChartsEnhanced.css';

// ApexCharts Candlestick Chart
const ApexCandlestickChart = ({ data }) => {
  const candleData = data.map((item) => ({
    x: new Date(item.date).getTime(),
    y: [item.open, item.high, item.low, item.close],
  }));

  const options = {
    chart: {
      type: 'candlestick',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'MMM dd',
      },
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
      labels: {
        formatter: (value) => `$${value.toFixed(2)}`,
      },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10b981',
          downward: '#ef4444',
        },
        wick: {
          useFillColor: true,
        },
      },
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'MMM dd, yyyy',
      },
    },
    grid: {
      borderColor: '#e2e8f0',
    },
  };

  return (
    <div className="apex-chart-wrapper">
      <ReactApexChart options={options} series={[{ data: candleData }]} type="candlestick" height={350} />
    </div>
  );
};

// ApexCharts Range Area Chart
const ApexRangeAreaChart = ({ data }) => {
  const rangeData = data.map((item) => ({
    x: new Date(item.date).getTime(),
    y: [item.low, item.high],
  }));

  const options = {
    chart: {
      type: 'rangeArea',
      height: 350,
      toolbar: {
        show: true,
      },
      animations: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'MMM dd',
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => `$${value.toFixed(2)}`,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    colors: ['#667eea'],
    grid: {
      borderColor: '#e2e8f0',
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
  };

  return (
    <div className="apex-chart-wrapper">
      <ReactApexChart
        options={options}
        series={[
          {
            name: 'Price Range',
            data: rangeData,
          },
        ]}
        type="rangeArea"
        height={350}
      />
    </div>
  );
};

// ApexCharts Heatmap for Volatility
const ApexVolatilityHeatmap = ({ data }) => {
  // Group data by week and calculate volatility
  const weeks = {};
  data.forEach((item) => {
    const date = new Date(item.date);
    const week = Math.floor(date.getDate() / 7);
    const day = date.getDay();

    if (!weeks[week]) weeks[week] = [];
    weeks[week][day] = Math.abs(item.daily_return_pct || 0);
  });

  const heatmapData = Object.entries(weeks).map(([week, values]) => ({
    name: `Week ${parseInt(week) + 1}`,
    data: values.map((val, day) => ({
      x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day] || 'N/A',
      y: val || 0,
    })),
  }));

  const options = {
    chart: {
      type: 'heatmap',
      height: 300,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 0.5,
              color: '#f0f4ff',
              name: 'Low Volatility',
            },
            {
              from: 0.5,
              to: 1.5,
              color: '#a8d5ff',
              name: 'Medium',
            },
            {
              from: 1.5,
              to: 3,
              color: '#667eea',
              name: 'High',
            },
            {
              from: 3,
              to: 5,
              color: '#764ba2',
              name: 'Very High',
            },
          ],
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        colors: ['#fff'],
        fontFamily: 'Helvetica, Arial, sans-serif',
      },
      formatter: (value) => (value ? `${value.toFixed(2)}%` : ''),
    },
    title: {
      text: 'Daily Volatility Heatmap (%)',
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
      },
    },
    grid: {
      borderColor: '#e2e8f0',
    },
  };

  return (
    <div className="apex-chart-wrapper">
      <ReactApexChart options={options} series={heatmapData} type="heatmap" height={300} />
    </div>
  );
};

// ApexCharts Waterfall for Price Movement
const ApexWaterfallChart = ({ data }) => {
  if (data.length === 0) return null;

  const startPrice = data[0].open;
  const endPrice = data[data.length - 1].close;
  const totalChange = endPrice - startPrice;

  const chartData = [
    {
      x: 'Opening Price',
      y: startPrice,
      type: 'category',
      fillColor: '#667eea',
    },
    {
      x: 'Daily Changes',
      y: totalChange,
      type: 'column',
      fillColor: totalChange >= 0 ? '#10b981' : '#ef4444',
    },
    {
      x: 'Closing Price',
      y: 0,
      type: 'total',
      fillColor: '#764ba2',
    },
  ];

  const options = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `$${value.toFixed(2)}`,
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#304758'],
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: ['Opening', 'Change', 'Closing'],
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => `$${value.toFixed(0)}`,
      },
    },
    grid: {
      borderColor: '#e2e8f0',
    },
    colors: ['#667eea', totalChange >= 0 ? '#10b981' : '#ef4444', '#764ba2'],
  };

  return (
    <div className="apex-chart-wrapper">
      <ReactApexChart
        options={options}
        series={[
          {
            name: 'Price ($)',
            data: [startPrice, totalChange, endPrice],
          },
        ]}
        type="bar"
        height={300}
      />
    </div>
  );
};

// ApexCharts Scatter Plot for Volume vs Return
const ApexScatterChart = ({ data }) => {
  const scatterData = data.map((item, index) => ({
    x: (item.daily_return_pct || 0) * 10,
    y: index,
  }));

  const options = {
    chart: {
      type: 'scatter',
      height: 300,
      toolbar: {
        show: true,
      },
    },
    xaxis: {
      type: 'numeric',
      labels: {
        formatter: (value) => `${(value / 10).toFixed(1)}%`,
      },
      title: {
        text: 'Daily Return %',
        style: {
          fontSize: '12px',
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      title: {
        text: 'Time Period',
        style: {
          fontSize: '12px',
          fontWeight: 600,
        },
      },
    },
    colors: ['#667eea'],
    grid: {
      borderColor: '#e2e8f0',
    },
    marker: {
      size: 6,
      hover: {
        size: 8,
      },
    },
  };

  return (
    <div className="apex-chart-wrapper">
      <ReactApexChart
        options={options}
        series={[
          {
            name: 'Returns',
            data: data.map((item) => ({
              x: item.daily_return_pct || 0,
              y: new Date(item.date).getTime(),
            })),
          },
        ]}
        type="scatter"
        height={300}
      />
    </div>
  );
};

// ApexCharts Radial Bar for Technical Indicators
const ApexRadialChart = ({ analysis }) => {
  if (!analysis) return null;

  const riskScore =
    analysis.risk_level === 'Low' ? 30 : analysis.risk_level === 'Medium' ? 60 : 90;

  const options = {
    chart: {
      type: 'radialBar',
      height: 320,
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: '70%',
          background: '#fff',
          image: undefined,
          imageOffsetX: 0,
          imageOffsetY: 0,
          position: 'front',
          dropShadow: {
            enabled: true,
            top: 3,
            left: 0,
            blur: 4,
            opacity: 0.24,
          },
        },
        track: {
          background: '#e2e8f0',
          strokeWidth: '100%',
          margin: 5,
          dropShadow: {
            enabled: true,
            top: 3,
            left: 0,
            color: '#000',
            opacity: 0.1,
            blur: 3,
          },
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: '#4a5568',
            fontSize: '14px',
            fontWeight: 600,
          },
          value: {
            offsetY: 5,
            color: '#2d3748',
            fontSize: '24px',
            fontWeight: 700,
            formatter: (val) => val + '%',
          },
        },
      },
    },
    colors: [
      analysis.risk_level === 'Low'
        ? '#10b981'
        : analysis.risk_level === 'Medium'
          ? '#f59e0b'
          : '#ef4444',
    ],
    labels: ['Risk Level'],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 250,
          },
        },
      },
    ],
  };

  return (
    <div className="apex-chart-wrapper">
      <ReactApexChart
        options={options}
        series={[riskScore]}
        type="radialBar"
        height={320}
      />
    </div>
  );
};

export {
  ApexCandlestickChart,
  ApexRangeAreaChart,
  ApexVolatilityHeatmap,
  ApexWaterfallChart,
  ApexScatterChart,
  ApexRadialChart,
};
