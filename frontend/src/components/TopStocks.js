import React, { useState, useEffect } from 'react';
import { stockAPI } from '../api';
import MarketLoading from './MarketLoading';
import './TopStocks.css';

let topStocksCache = null;
let topStocksCacheAt = 0;
const TOP_STOCKS_TTL_MS = 60 * 1000;

function TopStocks() {
  const [activeTab, setActiveTab] = useState('earners');
  const [earners, setEarners] = useState([]);
  const [longTerm, setLongTerm] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllTopStocks();
  }, []);

  const loadAllTopStocks = async () => {
    try {
      setError('');
      const now = Date.now();
      if (topStocksCache && now - topStocksCacheAt < TOP_STOCKS_TTL_MS) {
        setEarners(topStocksCache.earners);
        setLongTerm(topStocksCache.longTerm);
        setDaily(topStocksCache.daily);
        setLoading(false);
        return;
      }

      setLoading(true);
      const [earnersData, longTermData, dailyData] = await Promise.all([
        stockAPI.getTopEarners(),
        stockAPI.getTopLongTerm(),
        stockAPI.getTopDailyStocks(),
      ]);

      const data = {
        earners: earnersData.top_earners || [],
        longTerm: longTermData.top_long_term || [],
        daily: dailyData.top_daily || [],
      };

      topStocksCache = data;
      topStocksCacheAt = now;

      setEarners(data.earners);
      setLongTerm(data.longTerm);
      setDaily(data.daily);
    } catch (err) {
      setError('Failed to load top stocks data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value, market) => {
    if (market === 'NSE') {
      return `?${value.toLocaleString('en-IN')}`;
    }
    return `$${value.toLocaleString('en-US')}`;
  };

  const formatPercentage = (value) => {
    const color = value >= 0 ? 'positive' : 'negative';
    const sign = value >= 0 ? '+' : '';
    return <span className={color}>{sign}{value.toFixed(2)}%</span>;
  };

  const renderSkeletonRows = () => (
    <div className="top-stocks-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  );

  const renderEarnersTable = () => (
    <div className="top-stocks-table">
      <h3>Top 10 Earning Stocks Today</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Symbol</th>
              <th>Name</th>
              <th>Market</th>
              <th>Price</th>
              <th>Change</th>
              <th>% Change</th>
            </tr>
          </thead>
          <tbody>
            {earners.map((stock, index) => (
              <tr key={stock.symbol}>
                <td className="rank">{index + 1}</td>
                <td className="symbol">{stock.symbol}</td>
                <td className="name">{stock.name}</td>
                <td className="market">{stock.market}</td>
                <td className="price">{formatCurrency(stock.price, stock.market)}</td>
                <td className="change">{formatCurrency(stock.change, stock.market)}</td>
                <td className="change-pct">{formatPercentage(stock.change_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLongTermTable = () => (
    <div className="top-stocks-table">
      <h3>Top 10 Long-Term Investment Stocks</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Symbol</th>
              <th>Name</th>
              <th>Market</th>
              <th>Price</th>
              <th>Annual Return</th>
              <th>Volatility</th>
              <th>Sharpe Ratio</th>
              <th>Max Drawdown</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {longTerm.map((stock, index) => (
              <tr key={stock.symbol}>
                <td className="rank">{index + 1}</td>
                <td className="symbol">{stock.symbol}</td>
                <td className="name">{stock.name}</td>
                <td className="market">{stock.market}</td>
                <td className="price">{formatCurrency(stock.price, stock.market)}</td>
                <td className="annual-return">{formatPercentage(stock.annual_return)}</td>
                <td className="volatility">{stock.volatility.toFixed(2)}%</td>
                <td className="sharpe">{stock.sharpe_ratio.toFixed(2)}</td>
                <td className="drawdown">{stock.max_drawdown.toFixed(2)}%</td>
                <td className="score">{stock.score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDailyTable = () => (
    <div className="top-stocks-table">
      <h3>Top 10 Best Stocks of the Day</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Symbol</th>
              <th>Name</th>
              <th>Market</th>
              <th>Price</th>
              <th>% Change</th>
              <th>Volume</th>
              <th>Volume Ratio</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((stock, index) => (
              <tr key={stock.symbol}>
                <td className="rank">{index + 1}</td>
                <td className="symbol">{stock.symbol}</td>
                <td className="name">{stock.name}</td>
                <td className="market">{stock.market}</td>
                <td className="price">{formatCurrency(stock.price, stock.market)}</td>
                <td className="change-pct">{formatPercentage(stock.change_pct)}</td>
                <td className="volume">{(stock.volume / 1000000).toFixed(1)}M</td>
                <td className="volume-ratio">{stock.volume_ratio.toFixed(1)}x</td>
                <td className="score">{stock.score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <MarketLoading label="Loading top stocks and performance leaders..." />
        {renderSkeletonRows()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-stocks-error">
        <p>{error}</p>
        <button onClick={loadAllTopStocks}>Retry</button>
      </div>
    );
  }

  return (
    <div className="top-stocks">
      <div className="top-stocks-header">
        <h2>Top Performing Stocks</h2>
        <div className="tab-buttons">
          <button className={`tab-button ${activeTab === 'earners' ? 'active' : ''}`} onClick={() => setActiveTab('earners')}>
            Top Earners
          </button>
          <button className={`tab-button ${activeTab === 'longterm' ? 'active' : ''}`} onClick={() => setActiveTab('longterm')}>
            Long-Term
          </button>
          <button className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`} onClick={() => setActiveTab('daily')}>
            Best of Day
          </button>
        </div>
      </div>

      <div className="top-stocks-content">
        {activeTab === 'earners' && renderEarnersTable()}
        {activeTab === 'longterm' && renderLongTermTable()}
        {activeTab === 'daily' && renderDailyTable()}
      </div>
    </div>
  );
}

export default TopStocks;
