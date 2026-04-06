import React, { useEffect, useState } from 'react';
import { stockAPI } from '../api';
import './TopMovers.css';

const moversCache = new Map();

function TopMovers() {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const cached = moversCache.get(range);
        if (cached) {
          setGainers(cached.gainers);
          setLosers(cached.losers);
          return;
        }

        if (range === 30) {
          const [g, l] = await Promise.all([stockAPI.getTopEarners(), stockAPI.getTopLosers()]);
          const payload = {
            gainers: (g.top_earners || []).slice(0, 5),
            losers: (l.top_losers || []).slice(0, 5),
          };
          moversCache.set(range, payload);
          setGainers(payload.gainers);
          setLosers(payload.losers);
          return;
        }

        const companiesRes = await stockAPI.getCompanies();
        const symbols = (companiesRes.companies || []).map((c) => c.symbol).slice(0, 14);
        const changes = await Promise.all(
          symbols.map(async (symbol) => {
            const res = await stockAPI.getStockData(symbol, range);
            const series = res?.data || [];
            if (series.length < 2) return null;
            const first = Number(series[0].close || series[0].Close || 0);
            const last = Number(series[series.length - 1].close || series[series.length - 1].Close || 0);
            if (!first || !last) return null;
            const change_pct = ((last - first) / first) * 100;
            return { symbol, change_pct };
          })
        );

        const valid = changes.filter(Boolean);
        const payload = {
          gainers: [...valid].sort((a, b) => b.change_pct - a.change_pct).slice(0, 5),
          losers: [...valid].sort((a, b) => a.change_pct - b.change_pct).slice(0, 5),
        };
        moversCache.set(range, payload);
        setGainers(payload.gainers);
        setLosers(payload.losers);
      } catch (err) {
        setError('Unable to load top movers right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  return (
    <section className="top-movers">
      <div className="top-movers-head">
        <h3>Top Movers</h3>
        <select value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Select time range">
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>
      {loading && <div className="top-movers-state">Loading top movers...</div>}
      {error && <div className="top-movers-state error">{error}</div>}
      <div className="movers-grid">
        <div className="movers-block">
          <h4>Top Gainers (Last {range} Days)</h4>
          {gainers.map((item) => (
            <div key={item.symbol} className="mover-row">
              <span>{item.symbol}</span>
              <span className="up">{item.change_pct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <div className="movers-block">
          <h4>Top Losers (Last {range} Days)</h4>
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
