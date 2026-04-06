import React, { useEffect, useState } from 'react';
import { stockAPI } from '../api';
import './SmartInsights.css';

function SmartInsights({ symbol, analysis }) {
  const [sentimentSummary, setSentimentSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!symbol) return;
      const intelligence = await stockAPI.getMarketNewsIntelligence({ symbol, limit: 10 });
      setSentimentSummary(intelligence.summary);
    };
    load();
  }, [symbol]);

  if (!analysis) return null;

  const insights = [];
  if ((analysis.trend || '').toLowerCase().includes('up')) {
    insights.push('Stock is in an upward trend based on current price vs average price.');
  } else {
    insights.push('Stock is trading below its average level, indicating downward momentum.');
  }

  if ((analysis.volatility_pct || 0) >= 2.5) {
    insights.push('High volatility detected. Position sizing and risk controls are recommended.');
  } else {
    insights.push('Volatility remains contained, supporting steadier price behavior.');
  }

  if (sentimentSummary?.label === 'bearish') {
    insights.push('Recent news flow suggests bearish sentiment around this stock.');
  } else if (sentimentSummary?.label === 'bullish') {
    insights.push('Recent news flow suggests bullish sentiment support.');
  } else {
    insights.push('News sentiment is balanced with no dominant directional signal.');
  }

  return (
    <section className="smart-insights">
      <h3>Smart Insights</h3>
      <ul>
        {insights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default SmartInsights;
