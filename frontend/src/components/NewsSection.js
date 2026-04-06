import React, { useState, useEffect } from 'react';
import { stockAPI } from '../api';
import './NewsSection.css';

function NewsSection({ symbol }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      if (!symbol) return;
      try {
        setLoading(true);
        const data = await stockAPI.getStockNews(symbol);
        setNews(data.news || []);
        setError(null);
      } catch (err) {
        setError('Failed to load news');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol]);

  const getNewsIcon = (type) => {
    switch (type) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      case 'earnings': return '💰';
      case 'neutral': return '📰';
      default: return '📰';
    }
  };

  const getNewsColor = (type) => {
    switch (type) {
      case 'positive': return 'positive';
      case 'negative': return 'negative';
      case 'earnings': return 'earnings';
      case 'neutral': return 'neutral';
      default: return 'neutral';
    }
  };

  if (loading) {
    return <div className="news-section loading">⏳ Loading news...</div>;
  }

  if (error) {
    return <div className="news-section error">❌ {error}</div>;
  }

  if (!news || news.length === 0) {
    return <div className="news-section empty">📰 No news available for {symbol}</div>;
  }

  return (
    <div className="news-section">
      <h3>📰 Latest News</h3>
      <div className="news-container">
        {news.map((article, index) => (
          <div key={index} className={`news-card ${getNewsColor(article.type)}`}>
            <div className="news-header">
              <span className="news-icon">{getNewsIcon(article.type)}</span>
              <div className="news-meta">
                <h4>{article.title}</h4>
                <span className="news-source">{article.source} • {article.date}</span>
              </div>
            </div>
            <p className="news-content">{article.content}</p>
            <span className={`news-badge ${article.type}`}>{article.type.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NewsSection;
