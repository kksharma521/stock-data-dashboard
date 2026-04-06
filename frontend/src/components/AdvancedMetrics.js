import React from 'react';
import './AdvancedMetrics.css';

function AdvancedMetrics({ analysis }) {
  if (!analysis) return null;

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low':
        return '#10b981';
      case 'Medium':
        return '#f59e0b';
      case 'High':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getTrendColor = (trend) => {
    return trend === 'Uptrend' ? '#10b981' : '#ef4444';
  };

  const getTrendIcon = (trend) => {
    return trend === 'Uptrend' ? '📈' : '📉';
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'Low':
        return '🟢';
      case 'Medium':
        return '🟡';
      case 'High':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="advanced-metrics">
      <div className="metrics-section">
        <h3>Price Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-icon">💰</div>
            <div className="metric-info">
              <span className="metric-label">Current Price</span>
              <span className="metric-value">${analysis.latest_price.toFixed(2)}</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">📊</div>
            <div className="metric-info">
              <span className="metric-label">Average Price</span>
              <span className="metric-value">${analysis.average_price.toFixed(2)}</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">⬆️</div>
            <div className="metric-info">
              <span className="metric-label">52-Week High</span>
              <span className="metric-value">${analysis['52_week_high'].toFixed(2)}</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">⬇️</div>
            <div className="metric-info">
              <span className="metric-label">52-Week Low</span>
              <span className="metric-value">${analysis['52_week_low'].toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h3>Risk & Performance</h3>
        <div className="metrics-grid">
          <div className="metric-item highlight">
            <div className="metric-icon">{getTrendIcon(analysis.trend)}</div>
            <div className="metric-info">
              <span className="metric-label">Trend Status</span>
              <span className="metric-value" style={{ color: getTrendColor(analysis.trend) }}>
                {analysis.trend}
              </span>
            </div>
          </div>

          <div className="metric-item highlight">
            <div className="metric-icon">{getRiskIcon(analysis.risk_level)}</div>
            <div className="metric-info">
              <span className="metric-label">Risk Level</span>
              <span className="metric-value" style={{ color: getRiskColor(analysis.risk_level) }}>
                {analysis.risk_level}
              </span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">📉</div>
            <div className="metric-info">
              <span className="metric-label">Volatility</span>
              <span className="metric-value">{analysis.volatility_pct}%</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">📌</div>
            <div className="metric-info">
              <span className="metric-label">Distance from High</span>
              <span className="metric-value">{analysis.distance_from_52w_high_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h3>Analysis Summary</h3>
        <div className="summary-card">
          <div className="summary-row">
            <span className="summary-label">Price Range (52w)</span>
            <span className="summary-value">
              ${analysis['52_week_low'].toFixed(2)} - ${analysis['52_week_high'].toFixed(2)}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Price from Low</span>
            <span className="summary-value positive">
              +{(((analysis.latest_price - analysis['52_week_low']) / analysis['52_week_low']) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Recommendation</span>
            <span className={`summary-value ${analysis.risk_level === 'Low' ? 'positive' : analysis.risk_level === 'Medium' ? 'warning' : 'negative'}`}>
              {analysis.risk_level === 'Low' && '✓ Low Risk'}
              {analysis.risk_level === 'Medium' && '⚠ Medium Risk'}
              {analysis.risk_level === 'High' && '⚠ High Risk'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedMetrics;
