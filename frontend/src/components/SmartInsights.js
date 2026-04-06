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

    dynamic.push(
      aboveMA
        ? `${symbol} is trading above its 7-day moving average, indicating short-term bullish momentum.`
        : `${symbol} is below its 7-day moving average, suggesting near-term pressure persists.`
    );

    if ((analysis.volatility_pct || 0) >= 2.5) {
      dynamic.push(`${symbol} shows elevated volatility (${analysis.volatility_pct}%), so risk controls are important.`);
    } else {
      dynamic.push(`${symbol} volatility remains moderate (${analysis.volatility_pct}%), with relatively stable swings.`);
    }

    if (priceMomentum >= 1.5) {
      dynamic.push(`Price momentum is strong (+${priceMomentum.toFixed(2)}% day-over-day), confirming upside participation.`);
    } else if (priceMomentum <= -1.5) {
      dynamic.push(`Recent momentum is weak (${priceMomentum.toFixed(2)}% day-over-day), pointing to caution near resistance.`);
    } else {
      dynamic.push(`Day-over-day momentum is muted (${priceMomentum.toFixed(2)}%), with no decisive breakout signal.`);
    }

    const summary = intel?.summary?.label || 'neutral';
    const topNews = (intel?.items || [])[0];
    if (summary === 'bullish') {
      dynamic.push(`News sentiment for ${symbol} is currently bullish, supporting constructive market expectations.`);
    } else if (summary === 'bearish') {
      dynamic.push(`News sentiment for ${symbol} is bearish, which may cap upside until catalysts improve.`);
    } else {
      dynamic.push(`News sentiment for ${symbol} is balanced with mixed directional cues.`);
    }

    if (topNews?.keywords?.length) {
      dynamic.push(`Key sentiment drivers: ${topNews.keywords.slice(0, 4).join(', ')}.`);
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
        <ul>
          {insights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default SmartInsights;
