import React from 'react';
import './AdvancedMetrics.css';

function AdvancedMetrics({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="advanced-metrics">
      <div className="metrics-section">
        <h3>Price Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-info">
              <span className="metric-label">Current Price</span>
              <span className="metric-value">${analysis.latest_price.toFixed(2)}</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-info">
              <span className="metric-label">Average Price</span>
              <span className="metric-value">${analysis.average_price.toFixed(2)}</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-info">
              <span className="metric-label">52-Week High</span>
              <span className="metric-value">${analysis['52_week_high'].toFixed(2)}</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-info">
              <span className="metric-label">52-Week Low</span>
              <span className="metric-value">${analysis['52_week_low'].toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h3>Risk and Performance</h3>
        <div className="metrics-grid">
          <div className="metric-item highlight">
            <div className="metric-info">
              <span className="metric-label">Trend Status</span>
              <span className="metric-value" style={{ color: analysis.trend === 'Uptrend' ? '#0f766e' : '#b91c1c' }}>
                {analysis.trend}
              </span>
            </div>
          </div>

          <div className="metric-item highlight">
            <div className="metric-info">
              <span className="metric-label">Risk Level</span>
              <span className="metric-value">{analysis.risk_level}</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-info">
              <span className="metric-label">Volatility</span>
              <span className="metric-value">{analysis.volatility_pct}%</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-info">
              <span className="metric-label">Volatility Score</span>
              <span className="metric-value">{analysis.volatility_score ?? 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedMetrics;
