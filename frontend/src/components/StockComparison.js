import React, { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { stockAPI } from '../api';
import MarketLoading from './MarketLoading';
import './StockComparison.css';

function StockComparison({ companies }) {
  const [symbol1, setSymbol1] = useState('');
  const [symbol2, setSymbol2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [seriesData, setSeriesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companies || companies.length === 0) return;
    const first = companies[0]?.symbol || companies[0] || '';
    const second = companies[1]?.symbol || companies[1] || first;
    setSymbol1((prev) => prev || first);
    setSymbol2((prev) => prev || second);
  }, [companies]);

  useEffect(() => {
    if (!symbol1 || !symbol2 || symbol1 === symbol2) return;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const [cmp, s1, s2] = await Promise.all([
          stockAPI.compareStocks(symbol1, symbol2),
          stockAPI.getStockData(symbol1, 90),
          stockAPI.getStockData(symbol2, 90),
        ]);

        setComparison(cmp);

        const series = [
          {
            name: symbol1,
            data: (s1.data || []).map((row) => [new Date(row.date).getTime(), Number(row.close || 0)]),
          },
          {
            name: symbol2,
            data: (s2.data || []).map((row) => [new Date(row.date).getTime(), Number(row.close || 0)]),
          },
        ];
        setSeriesData(series);
      } catch (err) {
        setError('Failed to compare stocks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [symbol1, symbol2]);

  const options = useMemo(() => ({
    chart: {
      type: 'line',
      height: 340,
      zoom: { enabled: true, type: 'x' },
      toolbar: { show: true },
    },
    stroke: { curve: 'smooth', width: 2.6 },
    xaxis: { type: 'datetime', title: { text: 'Date' } },
    yaxis: { title: { text: 'Price (USD)' } },
    legend: { position: 'top' },
    tooltip: {
      shared: true,
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (v) => `$${Number(v).toFixed(2)}` },
    },
    colors: ['#1d4ed8', '#0f766e'],
  }), []);

  const rows = useMemo(() => {
    if (!comparison?.comparison) return [];
    const c = comparison.comparison;
    return [
      { label: `${comparison.symbol1} Latest`, value: `$${c.latest_price_symbol1?.toFixed?.(2) ?? c.latest_price_symbol1}` },
      { label: `${comparison.symbol2} Latest`, value: `$${c.latest_price_symbol2?.toFixed?.(2) ?? c.latest_price_symbol2}` },
      { label: 'Price Difference', value: `$${c.price_difference} (${c.price_difference_pct}%)` },
      { label: 'Return Spread', value: `${(c.return_symbol1 - c.return_symbol2).toFixed(2)}%` },
      { label: 'Trend Comparison', value: `${c.trend_symbol1} vs ${c.trend_symbol2}` },
      { label: 'More Volatile', value: c.more_volatile },
      { label: 'Better Performer', value: c.better_performer },
    ];
  }, [comparison]);

  if (loading) {
    return <MarketLoading label="Comparing stocks and generating analytics..." />;
  }

  return (
    <div className="stock-comparison">
      <div className="comparison-header">
        <h2>Stock Comparison</h2>
        <p>Compare price action, performance, trend and volatility across two symbols.</p>
      </div>

      <div className="comparison-selectors">
        <div className="selector-group">
          <label>First Stock</label>
          <select value={symbol1} onChange={(e) => setSymbol1(e.target.value)}>
            {companies.map((c) => {
              const symbol = typeof c === 'string' ? c : c.symbol;
              const name = typeof c === 'string' ? c : c.name;
              return <option key={symbol} value={symbol}>{symbol} - {name}</option>;
            })}
          </select>
        </div>

        <div className="selector-group">
          <label>Second Stock</label>
          <select value={symbol2} onChange={(e) => setSymbol2(e.target.value)}>
            {companies.map((c) => {
              const symbol = typeof c === 'string' ? c : c.symbol;
              const name = typeof c === 'string' ? c : c.name;
              return <option key={symbol} value={symbol}>{symbol} - {name}</option>;
            })}
          </select>
        </div>
      </div>

      {symbol1 === symbol2 && <div className="comparison-message">Please select two different stocks.</div>}
      {error && <div className="comparison-error">{error}</div>}

      {comparison && symbol1 !== symbol2 && (
        <>
          <div className="comparison-chart">
            <Chart options={options} series={seriesData} type="line" height={340} />
          </div>

          <div className="comparison-summary">
            <h3>Comparison Metrics</h3>
            <div className="summary-grid">
              {rows.map((row) => (
                <div key={row.label} className="summary-item">
                  <span className="summary-label">{row.label}</span>
                  <strong className="summary-value">{row.value}</strong>
                </div>
              ))}
            </div>
            <p className="summary-insight">{comparison.comparison.insight}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default StockComparison;
