import React, { useState, useEffect } from 'react';
import { stockAPI } from '../api';
import StockChart from './StockChart';
import AdvancedMetrics from './AdvancedMetrics';
import MarketStatus from './MarketStatus';
import AlertsSection from './AlertsSection';
import NewsSection from './NewsSection';
import SmartInsights from './SmartInsights';
import TopMovers from './TopMovers';
import './StockDetail.css';

function StockDetail({ company }) {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);

  const symbol = company?.symbol;
  const companyName = company?.name;

  useEffect(() => {
    const fetchData = async () => {
      if (!symbol) return;
      try {
        setLoading(true);
        const data = await stockAPI.getStockData(symbol, period);
        setStockData(data);
        setError(null);
      } catch (err) {
        setError(`Failed to load data for ${symbol}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, period]);

  if (!symbol) {
    return <div className="stock-detail empty">Select a stock to view details.</div>;
  }

  if (loading) {
    return <div className="stock-detail loading">Loading {symbol} market data...</div>;
  }

  if (error) {
    return <div className="stock-detail error">{error}</div>;
  }

  if (!stockData) {
    return <div className="stock-detail error">No data available.</div>;
  }

  const { analysis, data } = stockData;

  return (
    <div className="stock-detail">
      <MarketStatus />

      <div className="stock-detail-header">
        <div className="header-left">
          <div className="company-info">
            <h1>{companyName || symbol}</h1>
            <span className="company-symbol">{symbol}</span>
          </div>
          <div className="price-badge">${analysis.latest_price.toFixed(2)}</div>
        </div>
        <div className="period-selector">
          <label>Time Period:</label>
          <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={14}>2 weeks</option>
            <option value={30}>1 month</option>
            <option value={90}>3 months</option>
            <option value={180}>6 months</option>
            <option value={365}>1 year</option>
          </select>
        </div>
      </div>

      <AlertsSection symbol={symbol} />
      <SmartInsights symbol={symbol} analysis={analysis} />
      <TopMovers />
      <AdvancedMetrics analysis={analysis} />
      <StockChart data={data} symbol={symbol} analysis={analysis} />
      <NewsSection symbol={symbol} />
    </div>
  );
}

export default StockDetail;
