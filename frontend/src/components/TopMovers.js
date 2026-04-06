import React, { useEffect, useState } from 'react';
import { stockAPI } from '../api';
import './TopMovers.css';

function TopMovers() {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [g, l] = await Promise.all([stockAPI.getTopEarners(), stockAPI.getTopLosers()]);
      setGainers((g.top_earners || []).slice(0, 5));
      setLosers((l.top_losers || []).slice(0, 5));
    };
    load();
  }, []);

  return (
    <section className="top-movers">
      <h3>Top Movers</h3>
      <div className="movers-grid">
        <div className="movers-block">
          <h4>Top Gainers</h4>
          {gainers.map((item) => (
            <div key={item.symbol} className="mover-row">
              <span>{item.symbol}</span>
              <span className="up">{item.change_pct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <div className="movers-block">
          <h4>Top Losers</h4>
          {losers.map((item) => (
            <div key={item.symbol} className="mover-row">
              <span>{item.symbol}</span>
              <span className="down">{item.change_pct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopMovers;
