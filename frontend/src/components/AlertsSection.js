import React, { useState, useEffect } from 'react';
import { stockAPI } from '../api';
import './AlertsSection.css';

function AlertsSection({ symbol }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!symbol) return;
      try {
        setLoading(true);
        const data = await stockAPI.getStockAlerts(symbol);
        setAlerts(data.alerts || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setAlerts([{ type: 'info', title: 'Unable to load alerts', message: 'Using cached/default alert content' }]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [symbol]);

  const getAlertTag = (type) => {
    switch (type) {
      case 'success': return 'OK';
      case 'warning': return 'WARN';
      case 'alert': return 'ALRT';
      case 'info': return 'INFO';
      default: return 'NOTE';
    }
  };

  if (loading) {
    return <div className="alerts-section loading">Loading alerts...</div>;
  }

  if (error) {
    return <div className="alerts-section error">{error}</div>;
  }

  if (!alerts || alerts.length === 0) {
    return <div className="alerts-section empty">No alerts for {symbol}</div>;
  }

  return (
    <div className="alerts-section">
      <h3>Stock Alerts and Signals</h3>
      <div className="alerts-container">
        {alerts.map((alert, index) => (
          <div key={index} className={`alert-card ${alert.type}`}>
            <div className="alert-icon">{getAlertTag(alert.type)}</div>
            <div className="alert-content">
              <h4>{alert.title}</h4>
              <p>{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertsSection;
