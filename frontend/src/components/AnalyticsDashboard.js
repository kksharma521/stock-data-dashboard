import React, { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { stockAPI } from '../api';
import MarketLoading from './MarketLoading';
import './AnalyticsDashboard.css';

function AnalyticsDashboard({ symbol }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!symbol) return;
      try {
        setLoading(true);
        setError('');
        const data = await stockAPI.getStockData(symbol, 90);
        setPayload(data);
      } catch (err) {
        setError('Unable to load analytics for selected stock.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [symbol]);

  const trendSeries = useMemo(() => {
    if (!payload?.data) return [];
    const rows = payload.data;
    return [
      { name: 'Close', data: rows.map((r) => [new Date(r.date).getTime(), Number(r.close || 0)]) },
      { name: 'MA(7)', data: rows.map((r) => [new Date(r.date).getTime(), Number(r.ma_7 || 0)]) },
    ];
  }, [payload]);

  const trendOptions = useMemo(() => ({
    chart: { type: 'line', toolbar: { show: true }, zoom: { enabled: true } },
    xaxis: { type: 'datetime', title: { text: 'Date' } },
    yaxis: { title: { text: 'Price (USD)' } },
    stroke: { curve: 'smooth', width: [2.5, 2.5] },
    colors: ['#1d4ed8', '#0f766e'],
    legend: { position: 'top' },
    tooltip: { shared: true },
  }), []);

  const volatilitySeries = useMemo(() => {
    if (!payload?.data) return [];
    return [{ name: 'Daily Return %', data: payload.data.map((r) => [new Date(r.date).getTime(), Number(r.daily_return_pct || 0)]) }];
  }, [payload]);

  const volatilityOptions = useMemo(() => ({
    chart: { type: 'bar', toolbar: { show: true } },
    xaxis: { type: 'datetime', title: { text: 'Date' } },
    yaxis: { title: { text: 'Daily Return %' } },
    colors: ['#f59e0b'],
  }), []);

  if (loading) return <MarketLoading label="Generating analytics dashboard..." />;
  if (error) return <div className="analytics-error">{error}</div>;
  if (!payload) return null;

  const a = payload.analysis;

  return (
    <section className="analytics-dashboard">
      <header>
        <h2>Advanced Analytics</h2>
        <p>Data sourced from Yahoo Finance and internal analytics pipeline.</p>
      </header>

      <div className="analytics-metrics">
        <div><span>Trend</span><strong>{a.trend}</strong></div>
        <div><span>Volatility</span><strong>{a.volatility_pct}%</strong></div>
        <div><span>Risk</span><strong>{a.risk_level}</strong></div>
        <div><span>Distance from 52W High</span><strong>{a.distance_from_52w_high_pct}%</strong></div>
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3>Trend and Moving Average</h3>
          <Chart options={trendOptions} series={trendSeries} type="line" height={320} />
        </div>
        <div className="chart-card">
          <h3>Volatility (Daily Returns)</h3>
          <Chart options={volatilityOptions} series={volatilitySeries} type="bar" height={320} />
        </div>
      </div>
    </section>
  );
}

export default AnalyticsDashboard;
