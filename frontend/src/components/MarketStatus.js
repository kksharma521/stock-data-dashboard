import React, { useState, useEffect } from 'react';
import { stockAPI } from '../api';
import './MarketStatus.css';

function MarketStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const data = await stockAPI.getMarketStatus();
        setStatus(data);
      } catch (error) {
        console.error('Error fetching market status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !status) {
    return <div className="market-status loading">⏳ Loading market status...</div>;
  }

  const usMarket = status.us_market;
  const indiaMarket = status.india_market;

  return (
    <div className="market-status-container">
      <div className={`market-status ${usMarket?.is_open ? 'open' : 'closed'}`}>
        <div className="status-badge">
          <span className="status-icon">{usMarket?.is_open ? '🟢' : '🔴'}</span>
          <div className="status-info">
            <h4>US Market</h4>
            <h3>{usMarket?.status}</h3>
            <p>{usMarket?.current_time}</p>
          </div>
        </div>
      </div>

      <div className={`market-status ${indiaMarket?.is_open ? 'open' : 'closed'}`}>
        <div className="status-badge">
          <span className="status-icon">{indiaMarket?.is_open ? '🟢' : '🔴'}</span>
          <div className="status-info">
            <h4>Indian Market</h4>
            <h3>{indiaMarket?.status}</h3>
            <p>{indiaMarket?.current_time}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketStatus;
