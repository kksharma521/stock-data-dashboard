import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { stockAPI } from '../api';
import MarketLoading from './MarketLoading';
import './SentimentAnalysis.css';

const COLORS = ['#16a34a', '#6b7280', '#dc2626'];

const SentimentAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marketSentiment, setMarketSentiment] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const m = await stockAPI.getMarketSentiment();
        setMarketSentiment(m.market_sentiment);
      } catch (err) {
        setError('Unable to load sentiment analytics.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const distribution = useMemo(() => {
    if (!marketSentiment?.breakdown) return [];
    return [
      { name: 'Positive', value: marketSentiment.breakdown.bullish_stocks || 0 },
      { name: 'Neutral', value: marketSentiment.breakdown.neutral_stocks || 0 },
      { name: 'Negative', value: marketSentiment.breakdown.bearish_stocks || 0 },
    ];
  }, [marketSentiment]);

  const stockBars = useMemo(() => {
    return (marketSentiment?.stock_sentiments || []).map((s) => ({
      symbol: s.symbol,
      confidence: s.confidence,
      positive: s.sentiment_breakdown.positive,
      neutral: s.sentiment_breakdown.neutral,
      negative: s.sentiment_breakdown.negative,
    }));
  }, [marketSentiment]);

  const openStockDetail = async (symbol) => {
    const intel = await stockAPI.getMarketNewsIntelligence({ symbol, limit: 10 });
    const sourceCounter = {};
    (intel.items || []).forEach((n) => {
      sourceCounter[n.source] = (sourceCounter[n.source] || 0) + 1;
    });

    const top = intel.items || [];
    const positive = top.filter((n) => n.sentiment?.label === 'positive').length;
    const negative = top.filter((n) => n.sentiment?.label === 'negative').length;
    const neutral = top.length - positive - negative;

    const keywordCounter = {};
    top.forEach((n) => (n.keywords || []).forEach((k) => { keywordCounter[k] = (keywordCounter[k] || 0) + 1; }));

    setDetail({
      symbol,
      sentimentBreakdown: { positive, neutral, negative, total: top.length || 1 },
      sourceBreakdown: Object.entries(sourceCounter).map(([name, count]) => ({ name, count })),
      keywords: Object.entries(keywordCounter).sort((a, b) => b[1] - a[1]).slice(0, 8),
      news: top.slice(0, 5),
      confidence: intel.summary?.positive_pct || 50,
    });
  };

  if (loading) return <MarketLoading label="Running sentiment intelligence models..." />;
  if (error) return <div className="sentiment-error">{error}</div>;

  return (
    <div className="sentiment-analysis">
      <header className="sent-header">
        <h2>Sentiment Intelligence</h2>
        <p>Data sources: Yahoo Finance, market news feeds, and in-app NLP scoring.</p>
      </header>

      <div className="sent-summary-cards">
        <div className="card"><span>Market Sentiment</span><strong>{marketSentiment?.market_sentiment || 'neutral'}</strong></div>
        <div className="card"><span>Confidence</span><strong>{marketSentiment?.confidence || 0}%</strong></div>
        <div className="card"><span>Stocks Analyzed</span><strong>{marketSentiment?.analyzed_stocks || 0}</strong></div>
      </div>

      <div className="sent-grid">
        <div className="sent-panel">
          <h3>Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={distribution} dataKey="value" cx="50%" cy="50%" outerRadius={82} label>
                {distribution.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="sent-panel">
          <h3>Stock Confidence Scores</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stockBars}>
              <XAxis dataKey="symbol" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="confidence" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="stock-click-list">
            {stockBars.map((s) => (
              <button key={s.symbol} onClick={() => openStockDetail(s.symbol)}>{s.symbol}</button>
            ))}
          </div>
        </div>
      </div>

      {detail && (
        <div className="stock-detail-panel">
          <header>
            <h3>{detail.symbol} Detailed Sentiment View</h3>
            <button onClick={() => setDetail(null)}>Close</button>
          </header>

          <div className="detail-grid">
            <div>
              <h4>Sentiment Breakdown</h4>
              <ul>
                <li>Positive: {((detail.sentimentBreakdown.positive / detail.sentimentBreakdown.total) * 100).toFixed(1)}%</li>
                <li>Neutral: {((detail.sentimentBreakdown.neutral / detail.sentimentBreakdown.total) * 100).toFixed(1)}%</li>
                <li>Negative: {((detail.sentimentBreakdown.negative / detail.sentimentBreakdown.total) * 100).toFixed(1)}%</li>
              </ul>
            </div>

            <div>
              <h4>Source Breakdown</h4>
              <ul>
                {detail.sourceBreakdown.map((s) => (
                  <li key={s.name}>{s.name}: {s.count}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Key Drivers</h4>
              <div className="keyword-set">
                {detail.keywords.map(([k, c]) => <span key={k}>{k} ({c})</span>)}
              </div>
            </div>
          </div>

          <div className="detail-news">
            <h4>Related News</h4>
            {detail.news.map((n, idx) => (
              <article key={idx}>
                <strong>{n.title}</strong>
                <p>{n.summary}</p>
                <div className="meta">
                  <span>{n.source}</span>
                  <span>{n.sentiment?.label}</span>
                  <span>{n.impact}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysis;
