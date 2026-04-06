import React, { useState, useEffect } from 'react';
import { stockAPI } from '../api';
import './SentimentAnalysis.css';

const SentimentAnalysis = () => {
  const [marketSentiment, setMarketSentiment] = useState(null);
  const [selectedStock, setSelectedStock] = useState('');
  const [stockSentiment, setStockSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('market'); // 'market' or 'stock'

  useEffect(() => {
    fetchMarketSentiment();
  }, []);

  const fetchMarketSentiment = async () => {
    try {
      setLoading(true);
      const response = await stockAPI.getMarketSentiment();
      setMarketSentiment(response.market_sentiment);
      setError(null);
    } catch (err) {
      setError('Failed to load market sentiment data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockSentiment = async (symbol) => {
    if (!symbol) return;

    try {
      setLoading(true);
      const response = await stockAPI.getStockSentiment(symbol);
      setStockSentiment(response.sentiment_analysis);
      setError(null);
    } catch (err) {
      setError(`Failed to load sentiment data for ${symbol}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockSearch = (e) => {
    e.preventDefault();
    if (selectedStock.trim()) {
      fetchStockSentiment(selectedStock.trim().toUpperCase());
      setActiveView('stock');
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
      case 'bullish':
        return '#10b981';
      case 'negative':
      case 'bearish':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
      case 'bullish':
        return '📈';
      case 'negative':
      case 'bearish':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getSentimentLabel = (sentiment) => {
    switch (sentiment) {
      case 'bullish':
        return 'Bullish Market';
      case 'bearish':
        return 'Bearish Market';
      case 'positive':
        return 'Positive Sentiment';
      case 'negative':
        return 'Negative Sentiment';
      default:
        return 'Neutral Sentiment';
    }
  };

  if (loading) {
    return (
      <div className="sentiment-analysis loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing market sentiment with AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sentiment-analysis error">
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={fetchMarketSentiment} className="retry-btn">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sentiment-analysis">
      <div className="sentiment-header">
        <h2>AI-Powered Sentiment Analysis</h2>
        <p>Real-time market sentiment using LSTM neural networks trained on news and social media data</p>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${activeView === 'market' ? 'active' : ''}`}
            onClick={() => setActiveView('market')}
          >
            Market Overview
          </button>
          <button
            className={`toggle-btn ${activeView === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveView('stock')}
          >
            Stock Analysis
          </button>
        </div>
      </div>

      {activeView === 'market' && marketSentiment && (
        <div className="market-sentiment">
          <div className="sentiment-overview">
            <div className="sentiment-card main">
              <div className="sentiment-icon">
                {getSentimentIcon(marketSentiment.market_sentiment)}
              </div>
              <div className="sentiment-content">
                <h3>{getSentimentLabel(marketSentiment.market_sentiment)}</h3>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{
                      width: `${marketSentiment.confidence}%`,
                      backgroundColor: getSentimentColor(marketSentiment.market_sentiment)
                    }}
                  ></div>
                </div>
                <span className="confidence-text">{marketSentiment.confidence}% Confidence</span>
              </div>
            </div>

            <div className="sentiment-stats">
              <div className="stat-card">
                <span className="stat-label">Stocks Analyzed</span>
                <span className="stat-value">{marketSentiment.analyzed_stocks}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Bullish Stocks</span>
                <span className="stat-value" style={{ color: '#10b981' }}>
                  {marketSentiment.breakdown.bullish_stocks}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Bearish Stocks</span>
                <span className="stat-value" style={{ color: '#ef4444' }}>
                  {marketSentiment.breakdown.bearish_stocks}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Neutral Stocks</span>
                <span className="stat-value" style={{ color: '#6b7280' }}>
                  {marketSentiment.breakdown.neutral_stocks}
                </span>
              </div>
            </div>
          </div>

          <div className="stock-sentiments">
            <h3>Individual Stock Sentiments</h3>
            <div className="stock-grid">
              {marketSentiment.stock_sentiments.map((stock, index) => (
                <div key={index} className="stock-sentiment-card">
                  <div className="stock-header">
                    <span className="stock-symbol">{stock.symbol}</span>
                    <span
                      className="stock-sentiment-icon"
                      style={{ color: getSentimentColor(stock.overall_sentiment) }}
                    >
                      {getSentimentIcon(stock.overall_sentiment)}
                    </span>
                  </div>
                  <div className="stock-confidence">
                    <div className="mini-confidence-bar">
                      <div
                        className="mini-confidence-fill"
                        style={{
                          width: `${stock.confidence}%`,
                          backgroundColor: getSentimentColor(stock.overall_sentiment)
                        }}
                      ></div>
                    </div>
                    <span className="mini-confidence-text">{stock.confidence}%</span>
                  </div>
                  <div className="stock-breakdown">
                    <span>📊 {stock.sentiment_breakdown.positive} Positive</span>
                    <span>⚪ {stock.sentiment_breakdown.neutral} Neutral</span>
                    <span>📉 {stock.sentiment_breakdown.negative} Negative</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'stock' && (
        <div className="stock-sentiment-view">
          <form onSubmit={handleStockSearch} className="stock-search-form">
            <input
              type="text"
              placeholder="Enter stock symbol (e.g., AAPL, TSLA)"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value.toUpperCase())}
              className="stock-input"
            />
            <button type="submit" className="analyze-btn">
              Analyze Sentiment
            </button>
          </form>

          {stockSentiment && (
            <div className="stock-sentiment-details">
              <div className="sentiment-header">
                <h3>{stockSentiment.symbol} Sentiment Analysis</h3>
                <div className="sentiment-badge" style={{ backgroundColor: getSentimentColor(stockSentiment.overall_sentiment) }}>
                  {getSentimentIcon(stockSentiment.overall_sentiment)} {stockSentiment.overall_sentiment.toUpperCase()}
                </div>
              </div>

              <div className="sentiment-metrics">
                <div className="metric-card">
                  <span className="metric-label">Overall Confidence</span>
                  <span className="metric-value">{stockSentiment.confidence}%</span>
                  <div className="metric-bar">
                    <div
                      className="metric-fill"
                      style={{
                        width: `${stockSentiment.confidence}%`,
                        backgroundColor: getSentimentColor(stockSentiment.overall_sentiment)
                      }}
                    ></div>
                  </div>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Sources Analyzed</span>
                  <span className="metric-value">{stockSentiment.total_sources}</span>
                </div>
              </div>

              <div className="sentiment-breakdown">
                <h4>Sentiment Breakdown</h4>
                <div className="breakdown-bars">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Positive</span>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-fill positive"
                        style={{ width: `${(stockSentiment.sentiment_breakdown.positive / stockSentiment.total_sources) * 100}%` }}
                      ></div>
                    </div>
                    <span className="breakdown-count">{stockSentiment.sentiment_breakdown.positive}</span>
                  </div>

                  <div className="breakdown-item">
                    <span className="breakdown-label">Neutral</span>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-fill neutral"
                        style={{ width: `${(stockSentiment.sentiment_breakdown.neutral / stockSentiment.total_sources) * 100}%` }}
                      ></div>
                    </div>
                    <span className="breakdown-count">{stockSentiment.sentiment_breakdown.neutral}</span>
                  </div>

                  <div className="breakdown-item">
                    <span className="breakdown-label">Negative</span>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-fill negative"
                        style={{ width: `${(stockSentiment.sentiment_breakdown.negative / stockSentiment.total_sources) * 100}%` }}
                      ></div>
                    </div>
                    <span className="breakdown-count">{stockSentiment.sentiment_breakdown.negative}</span>
                  </div>
                </div>
              </div>

              <div className="sentiment-sources">
                <div className="sources-section">
                  <h4>Recent News</h4>
                  <div className="sources-list">
                    {stockSentiment.recent_news.map((news, index) => (
                      <div key={index} className="source-item">
                        <span className="source-type">📰</span>
                        <div className="source-content">
                          <p className="source-text">{news.title}</p>
                          <span className="source-meta">{news.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sources-section">
                  <h4>Social Media Sentiment</h4>
                  <div className="sources-list">
                    {stockSentiment.social_sentiment.map((social, index) => (
                      <div key={index} className="source-item">
                        <span className="source-type">
                          {social.platform === 'twitter' ? '🐦' : social.platform === 'reddit' ? '🟠' : '📱'}
                        </span>
                        <div className="source-content">
                          <p className="source-text">{social.text}</p>
                          <span className="source-meta">{social.author || social.platform}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="sentiment-footer">
        <div className="ai-info">
          <span className="ai-icon">🤖</span>
          <span>Powered by LSTM Neural Networks trained on S&P 500 data</span>
        </div>
        <button onClick={fetchMarketSentiment} className="refresh-btn">
          🔄 Refresh Analysis
        </button>
      </div>
    </div>
  );
};

export default SentimentAnalysis;