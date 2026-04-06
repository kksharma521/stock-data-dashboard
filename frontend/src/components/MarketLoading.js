import React, { useEffect, useMemo, useState } from 'react';
import './MarketLoading.css';

const DEFAULT_TIPS = [
  'Diversification helps reduce concentration risk.',
  'Strong earnings momentum often supports trend continuation.',
  'Use volatility and position sizing together for risk control.',
  'Price above moving average can indicate positive momentum.',
  'Always combine news sentiment with price action confirmation.',
];

function MarketLoading({ label = 'Loading market data...', tips = DEFAULT_TIPS, compact = false }) {
  const safeTips = useMemo(() => (tips && tips.length ? tips : DEFAULT_TIPS), [tips]);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % safeTips.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [safeTips.length]);

  return (
    <div className={`market-loading ${compact ? 'compact' : ''}`}>
      <div className="ticker-animation">
        <span className="dot" />
        <span className="line" />
        <span className="dot" />
      </div>
      <div className="loading-text">{label}</div>
      <div className="loading-tip">Tip: {safeTips[tipIndex]}</div>
    </div>
  );
}

export default MarketLoading;
