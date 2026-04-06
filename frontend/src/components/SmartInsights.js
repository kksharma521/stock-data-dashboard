import React, { useEffect, useMemo, useState } from 'react';
import { stockAPI } from '../api';
import './SmartInsights.css';

function SmartInsights({ symbol, analysis, data = [] }) {
  const [intel, setIntel] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!symbol) return;
      const res = await stockAPI.getMarketNewsIntelligence({ symbol, limit: 12 });
      setIntel(res);
    };
    load();
  }, [symbol]);

  const insights = useMemo(() => {
    if (!analysis || !Array.isArray(data) || data.length < 3) return [];

    const latest = data[data.length - 1];
    const prev = data[data.length - 2];
    const ma7 = Number(latest.ma_7 || analysis.average_price || 0);
    const latestClose = Number(latest.close || 0);
    const prevClose = Number(prev.close || 0);

    const priceMomentum = prevClose ? ((latestClose - prevClose) / prevClose) * 100 : 0;
    const aboveMA = latestClose > ma7;

    const dynamic = [];

    dynamic.push({
      title: 'Trend Analysis',
      indicator: aboveMA ? 'Uptrend' : 'Downtrend',
      body: aboveMA
        ? `${symbol} is trading above its 7-day moving average, indicating short-term bullish momentum.`
        : `${symbol} is below its 7-day moving average, suggesting near-term pressure persists.`,
    });

    if ((analysis.volatility_pct || 0) >= 2.5) {
      dynamic.push({
        title: 'Volatility Signal',
        indicator: 'Elevated',
        body: `${symbol} shows elevated volatility (${analysis.volatility_pct}%), so risk controls are important.`,
      });
    } else {
      dynamic.push({
        title: 'Volatility Signal',
        indicator: 'Stable',
        body: `${symbol} volatility remains moderate (${analysis.volatility_pct}%), with relatively stable swings.`,
      });
    }

    if (priceMomentum >= 1.5) {
      dynamic.push({
        title: 'Momentum Check',
        indicator: 'Uptrend',
        body: `Price momentum is strong (+${priceMomentum.toFixed(2)}% day-over-day), confirming upside participation.`,
      });
    } else if (priceMomentum <= -1.5) {
      dynamic.push({
        title: 'Momentum Check',
        indicator: 'Downtrend',
        body: `Recent momentum is weak (${priceMomentum.toFixed(2)}% day-over-day), pointing to caution near resistance.`,
      });
    } else {
      dynamic.push({
        title: 'Momentum Check',
        indicator: 'Stable',
        body: `Day-over-day momentum is muted (${priceMomentum.toFixed(2)}%), with no decisive breakout signal.`,
      });
    }

    const summary = intel?.summary?.label || 'neutral';
    const topNews = (intel?.items || [])[0];
    if (summary === 'bullish') {
      dynamic.push({
        title: 'News Sentiment',
        indicator: 'Uptrend',
        body: `News sentiment for ${symbol} is currently bullish, supporting constructive market expectations.`,
      });
    } else if (summary === 'bearish') {
      dynamic.push({
        title: 'News Sentiment',
        indicator: 'Downtrend',
        body: `News sentiment for ${symbol} is bearish, which may cap upside until catalysts improve.`,
      });
    } else {
      dynamic.push({
        title: 'News Sentiment',
        indicator: 'Stable',
        body: `News sentiment for ${symbol} is balanced with mixed directional cues.`,
      });
    }

    if (topNews?.keywords?.length) {
      dynamic.push({
        title: 'Key Drivers',
        indicator: 'Context',
        body: `Primary drivers: ${topNews.keywords.slice(0, 4).join(', ')}.`,
      });
    }

    return dynamic.slice(0, 5);
  }, [analysis, data, intel, symbol]);

  if (!analysis) return null;

  return (
    <section className="smart-insights">
      <h3>Smart Insights</h3>
      {insights.length === 0 ? (
        <p className="insights-empty">Insights will appear after sufficient data is available.</p>
      ) : (
        <div className="insights-grid">
          {insights.map((item) => (
            <article key={`${item.title}-${item.body}`} className="insight-card">
              <header>
                <h4>{item.title}</h4>
                <span className={`insight-indicator ${item.indicator.toLowerCase()}`}>{item.indicator}</span>
              </header>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default SmartInsights;
