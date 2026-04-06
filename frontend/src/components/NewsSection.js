import React from 'react';
import MarketNewsIntelligence from './MarketNewsIntelligence';

function NewsSection({ symbol }) {
  return <MarketNewsIntelligence symbol={symbol} compact />;
}

export default NewsSection;
