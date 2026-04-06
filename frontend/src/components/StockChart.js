import React, { useState } from 'react';
import {
  LineChartComponent,
  AreaChartComponent,
  BarChartComponent,
  CandlestickChart,
  ReturnChartComponent,
} from './AdvancedChart';
import {
  ApexCandlestickChart,
  ApexRangeAreaChart,
  ApexVolatilityHeatmap,
  ApexWaterfallChart,
  ApexScatterChart,
  ApexRadialChart,
} from './AdvancedChartsEnhanced';
import {
  RadarChartComponent,
  BubbleChartComponent,
  ComboChartComponent,
  PriceDistributionChart,
} from './ChartJSEnhanced';
import './StockChart.css';

function StockChart({ data, symbol, analysis }) {
  const [chartType, setChartType] = useState('candlestick-apex');

  if (!data || data.length === 0) {
    return <div className="stock-chart empty">No chart data available</div>;
  }

  const renderChart = () => {
    switch (chartType) {
      // ApexCharts
      case 'candlestick-apex':
        return <ApexCandlestickChart data={data} />;
      case 'range-area':
        return <ApexRangeAreaChart data={data} />;
      case 'volatility-heatmap':
        return <ApexVolatilityHeatmap data={data} />;
      case 'price-waterfall':
        return <ApexWaterfallChart data={data} />;
      case 'scatter':
        return <ApexScatterChart data={data} />;
      case 'risk-radial':
        return <ApexRadialChart analysis={analysis} />;
      // Recharts
      case 'candlestick':
        return <CandlestickChart data={data} />;
      case 'line':
        return <LineChartComponent data={data} />;
      case 'area':
        return <AreaChartComponent data={data} />;
      case 'bar':
        return <BarChartComponent data={data} />;
      case 'returns':
        return <ReturnChartComponent data={data} />;
      // Chart.js
      case 'radar':
        return <RadarChartComponent analysis={analysis} />;
      case 'bubble':
        return <BubbleChartComponent data={data} />;
      case 'combo':
        return <ComboChartComponent data={data} />;
      case 'distribution':
        return <PriceDistributionChart data={data} />;
      default:
        return <ApexCandlestickChart data={data} />;
    }
  };

  const getChartStats = () => {
    const prices = data.map((d) => d.close);
    const returns = data.map((d) => d.daily_return_pct || 0);

    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    const avgReturn = (returns.reduce((a, b) => a + b, 0) / returns.length).toFixed(2);
    const maxReturn = Math.max(...returns).toFixed(2);

    return {
      highPrice: highPrice.toFixed(2),
      lowPrice: lowPrice.toFixed(2),
      avgReturn,
      maxReturn,
    };
  };

  const stats = getChartStats();

  const chartGroups = {
    'ApexCharts (Professional)': [
      { id: 'candlestick-apex', label: '🕯️ Candlestick Pro', icon: '📊' },
      { id: 'range-area', label: '📈 Range Area', icon: '📊' },
      { id: 'volatility-heatmap', label: '🔥 Volatility Map', icon: '🌡️' },
      { id: 'price-waterfall', label: '💧 Price Flow', icon: '💧' },
      { id: 'scatter', label: '🎯 Scatter', icon: '🎯' },
      { id: 'risk-radial', label: '🎨 Risk Radial', icon: '🎨' },
    ],
    'Recharts (Classic)': [
      { id: 'candlestick', label: '🕯️ Candlestick', icon: '📊' },
      { id: 'line', label: '📈 Line', icon: '📈' },
      { id: 'area', label: '📉 Area', icon: '📉' },
      { id: 'bar', label: '📏 Bar', icon: '📏' },
      { id: 'returns', label: '📊 Returns', icon: '📊' },
    ],
    'Chart.js (Advanced)': [
      { id: 'radar', label: '🎯 Radar', icon: '🎯' },
      { id: 'bubble', label: '🫧 Bubble', icon: '🫧' },
      { id: 'combo', label: '🔀 Combo', icon: '🔀' },
      { id: 'distribution', label: '📊 Distribution', icon: '📊' },
    ],
  };

  return (
    <div className="stock-chart">
      <div className="chart-header">
        <h3>Price Analysis & Technical Charts - {symbol}</h3>
      </div>

      <div className="chart-selector-section">
        {Object.entries(chartGroups).map(([group, charts]) => (
          <div key={group} className="chart-group">
            <div className="group-label">{group}</div>
            <div className="chart-buttons">
              {charts.map((chart) => (
                <button
                  key={chart.id}
                  className={`chart-button ${chartType === chart.id ? 'active' : ''}`}
                  onClick={() => setChartType(chart.id)}
                  title={chart.label}
                >
                  {chart.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="chart-container">{renderChart()}</div>

      <div className="chart-stats">
        <div className="stat-card">
          <div className="stat-label">Highest Price</div>
          <div className="stat-value">${stats.highPrice}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lowest Price</div>
          <div className="stat-value">${stats.lowPrice}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Daily Return</div>
          <div className={`stat-value ${parseFloat(stats.avgReturn) >= 0 ? 'positive' : 'negative'}`}>
            {stats.avgReturn}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Max Daily Return</div>
          <div className={`stat-value ${parseFloat(stats.maxReturn) >= 0 ? 'positive' : 'negative'}`}>
            {stats.maxReturn}%
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="chart-table">
        <h4>Recent Price Data</h4>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Open</th>
              <th>Close</th>
              <th>High</th>
              <th>Low</th>
              <th>MA-7</th>
              <th>Daily Return %</th>
            </tr>
          </thead>
          <tbody>
            {data
              .slice(-10)
              .reverse()
              .map((row, i) => (
                <tr key={i}>
                  <td>{new Date(row.date).toLocaleDateString()}</td>
                  <td>${row.open?.toFixed(2) || 'N/A'}</td>
                  <td>${row.close.toFixed(2)}</td>
                  <td>${row.high?.toFixed(2) || 'N/A'}</td>
                  <td>${row.low?.toFixed(2) || 'N/A'}</td>
                  <td>{row.ma_7 ? `$${row.ma_7.toFixed(2)}` : 'N/A'}</td>
                  <td className={row.daily_return_pct >= 0 ? 'positive' : 'negative'}>
                    {row.daily_return_pct}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockChart;
