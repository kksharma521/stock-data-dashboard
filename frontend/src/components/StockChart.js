import React, { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import MarketLoading from './MarketLoading';
import './StockChart.css';

function StockChart({ data, symbol, analysis }) {
  const [viewMode, setViewMode] = useState('price');
  const [timeRange, setTimeRange] = useState(30);
  const [isExpanded, setIsExpanded] = useState(false);

  const rangeData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.slice(-timeRange);
  }, [data, timeRange]);

  const mapped = useMemo(() => {
    return rangeData.map((row) => ({
      x: new Date(row.date).getTime(),
      close: Number(row.close ?? 0),
      ma7: Number(row.ma_7 ?? row.close ?? 0),
      ret: Number(row.daily_return_pct ?? 0),
    }));
  }, [rangeData]);

  const series = useMemo(() => {
    if (viewMode === 'price') {
      return [{ name: `${symbol} Price`, data: mapped.map((p) => [p.x, p.close]) }];
    }

    if (viewMode === 'ma') {
      return [
        { name: `${symbol} Close`, data: mapped.map((p) => [p.x, p.close]) },
        { name: '7 Day Moving Average', data: mapped.map((p) => [p.x, p.ma7]) },
      ];
    }

    const firstClose = mapped[0]?.close || 1;
    return [
      {
        name: `${symbol} Normalized Price`,
        data: mapped.map((p) => [p.x, ((p.close / firstClose) - 1) * 100]),
      },
      { name: 'Daily Return %', data: mapped.map((p) => [p.x, p.ret]) },
    ];
  }, [mapped, symbol, viewMode]);

  const yAxisTitle = viewMode === 'compare' ? 'Percent (%)' : 'Price (USD)';

  const chartOptions = useMemo(() => ({
    chart: {
      type: 'line',
      height: isExpanded ? 540 : 360,
      zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
      toolbar: { show: true, tools: { download: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } },
      animations: { easing: 'easeinout', speed: 300 },
      background: '#ffffff',
    },
    stroke: { curve: 'smooth', width: viewMode === 'ma' ? [2.5, 2.5] : 2.5 },
    colors: viewMode === 'compare' ? ['#1d4ed8', '#f59e0b'] : ['#1d4ed8', '#10b981'],
    xaxis: {
      type: 'datetime',
      title: { text: 'Date' },
      labels: { datetimeUTC: false },
    },
    yaxis: {
      title: { text: yAxisTitle },
      labels: { formatter: (val) => (viewMode === 'compare' ? `${val.toFixed(2)}%` : `$${val.toFixed(2)}`) },
    },
    legend: { show: true, position: 'top', horizontalAlign: 'left' },
    tooltip: {
      shared: true,
      x: { format: 'dd MMM yyyy' },
      y: {
        formatter: (val) => (viewMode === 'compare' ? `${Number(val).toFixed(2)}%` : `$${Number(val).toFixed(2)}`),
      },
    },
    grid: { borderColor: '#e5e7eb' },
    dataLabels: { enabled: false },
  }), [isExpanded, viewMode, yAxisTitle]);

  if (!rangeData.length) {
    return <MarketLoading label="Loading chart and technical overlays..." compact />;
  }

  const chartBody = (
    <>
      <div className="chart-toolbar">
        <div className="chart-view-switch">
          <button className={viewMode === 'price' ? 'active' : ''} onClick={() => setViewMode('price')}>Price</button>
          <button className={viewMode === 'ma' ? 'active' : ''} onClick={() => setViewMode('ma')}>Price + MA(7)</button>
          <button className={viewMode === 'compare' ? 'active' : ''} onClick={() => setViewMode('compare')}>Comparison</button>
        </div>
        <div className="chart-range-switch">
          {[7, 30, 90].map((range) => (
            <button key={range} className={timeRange === range ? 'active' : ''} onClick={() => setTimeRange(range)}>
              {range}d
            </button>
          ))}
          <button className="expand-btn" onClick={() => setIsExpanded(true)}>Expand View</button>
        </div>
      </div>

      <div className="chart-container-professional">
        <Chart options={chartOptions} series={series} type="line" height={isExpanded ? 540 : 360} />
      </div>

      <div className="chart-insight-row">
        <div>
          <span className="label">Trend</span>
          <strong>{analysis?.trend || 'N/A'}</strong>
        </div>
        <div>
          <span className="label">Volatility</span>
          <strong>{analysis?.volatility_pct?.toFixed?.(2) ?? analysis?.volatility_pct ?? 0}%</strong>
        </div>
        <div>
          <span className="label">Risk</span>
          <strong>{analysis?.risk_level || 'N/A'}</strong>
        </div>
      </div>
    </>
  );

  return (
    <section className="stock-chart">
      <div className="chart-header">
        <h3>{symbol} Market Chart</h3>
      </div>
      {chartBody}

      {isExpanded && (
        <div className="chart-modal-overlay" onClick={() => setIsExpanded(false)}>
          <div className="chart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chart-modal-header">
              <h4>{symbol} Expanded Analysis</h4>
              <button onClick={() => setIsExpanded(false)}>Close</button>
            </div>
            {chartBody}
          </div>
        </div>
      )}
    </section>
  );
}

export default StockChart;
