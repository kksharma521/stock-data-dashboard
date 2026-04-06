import React from 'react';
import './MetricsPanel.css';

function MetricsPanel({ analysis }) {
  if (!analysis) return null;

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low':
        return '#4CAF50';
      case 'Medium':
        return '#FFC107';
      case 'High':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getTrendColor = (trend) => {
    return trend === 'Uptrend' ? '#4CAF50' : '#F44336';
  };

  return (
    <div className="metrics-panel">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Current Price</div>
          <div className="metric-value">${analysis.latest_price.toFixed(2)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Average Price</div>
          <div className="metric-value">${analysis.average_price.toFixed(2)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">52-Week High</div>
          <div className="metric-value">${analysis['52_week_high'].toFixed(2)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">52-Week Low</div>
          <div className="metric-value">${analysis['52_week_low'].toFixed(2)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Volatility</div>
          <div className="metric-value">{analysis.volatility_pct}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Risk Level</div>
          <div className="metric-value" style={{ color: getRiskColor(analysis.risk_level) }}>
            {analysis.risk_level}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Trend</div>
          <div className="metric-value" style={{ color: getTrendColor(analysis.trend) }}>
            {analysis.trend}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Distance from High</div>
          <div className="metric-value">{analysis.distance_from_52w_high_pct}%</div>
        </div>
      </div>
    </div>
  );
}

export default MetricsPanel;
