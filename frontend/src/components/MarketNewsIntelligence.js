import React, { useEffect, useMemo, useState } from 'react';
import { stockAPI } from '../api';
import './MarketNewsIntelligence.css';

function timeAgo(isoDate) {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sentimentClass(label) {
  if (label === 'positive') return 'sentiment-positive';
  if (label === 'negative') return 'sentiment-negative';
  return 'sentiment-neutral';
}

function impactSymbol(impact) {
  if (impact === 'bullish') return 'UP';
  if (impact === 'bearish') return 'DOWN';
  return 'FLAT';
}

function MarketNewsIntelligence({ symbol = '', compact = false }) {
  const [tickerFilter, setTickerFilter] = useState(symbol || '');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({
    summary: { message: '', label: 'neutral', positive_pct: 0 },
    trending_stocks: [],
    high_impact_news: [],
    items: [],
  });

  useEffect(() => {
    setTickerFilter(symbol || '');
  }, [symbol]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await stockAPI.getMarketNewsIntelligence({
          symbol: tickerFilter.trim(),
          sentiment: sentimentFilter,
          limit: compact ? 8 : 24,
        });
        setPayload(data);
      } catch (err) {
        setError('Unable to load market intelligence right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tickerFilter, sentimentFilter, compact]);

  const visibleItems = useMemo(() => payload.items || [], [payload.items]);

  return (
    <section className={`market-news ${compact ? 'compact' : ''}`}>
      <header className="market-news-header">
        <div>
          <h3>Market News Intelligence</h3>
          <p>{payload.summary?.message || "Today's market sentiment is Neutral (50% positive)."}</p>
        </div>
        {!compact && (
          <div className="market-news-filters">
            <input
              type="text"
              placeholder="Filter ticker (AAPL)"
              value={tickerFilter}
              onChange={(e) => setTickerFilter(e.target.value.toUpperCase())}
            />
            <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)}>
              <option value="">All sentiment</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        )}
      </header>

      {!compact && payload.trending_stocks?.length > 0 && (
        <div className="trending-stocks">
          <span>Trending:</span>
          {payload.trending_stocks.map((item) => (
            <button key={item.symbol} onClick={() => setTickerFilter(item.symbol)}>
              {item.symbol} ({item.news_count})
            </button>
          ))}
        </div>
      )}

      {!compact && payload.high_impact_news?.length > 0 && (
        <div className="high-impact-strip">
          <h4>High Impact News</h4>
          <div className="high-impact-items">
            {payload.high_impact_news.slice(0, 3).map((item, idx) => (
              <article key={`${item.symbol}-${idx}`} className="impact-chip">
                <span className={`impact-badge impact-${item.impact}`}>{impactSymbol(item.impact)}</span>
                <span>{item.symbol}: {item.title}</span>
              </article>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="news-state">Loading market intelligence...</div>}
      {error && <div className="news-state error">{error}</div>}
      {!loading && !error && visibleItems.length === 0 && <div className="news-state">No news matched your filters.</div>}

      {!loading && !error && visibleItems.length > 0 && (
        <div className="news-grid">
          {visibleItems.map((item, idx) => (
            <article key={`${item.symbol}-${idx}`} className="news-card-intel">
              <div className="news-card-top">
                <span className="ticker-badge">{item.symbol}</span>
                <span className={`sentiment-pill ${sentimentClass(item.sentiment?.label)}`}>
                  {item.sentiment?.label || 'neutral'} ({item.sentiment?.score ?? 0})
                </span>
                <span className={`impact-pill impact-${item.impact}`}>{impactSymbol(item.impact)}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
              <div className="keyword-row">
                {(item.keywords || []).slice(0, 5).map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
              <footer>
                <span>{item.source}</span>
                <span>{timeAgo(item.published_at)}</span>
                <span>Confidence: {item.confidence}</span>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : null}
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MarketNewsIntelligence;
