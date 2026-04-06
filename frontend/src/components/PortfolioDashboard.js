import React, { useEffect, useMemo, useState } from 'react';
import './PortfolioDashboard.css';

function PortfolioDashboard({ companies = [] }) {
  const [positions, setPositions] = useState([]);
  const [form, setForm] = useState({ symbol: companies[0]?.symbol || 'AAPL', qty: 1, price: 100, side: 'buy' });

  useEffect(() => {
    const saved = localStorage.getItem('portfolio_positions');
    if (saved) setPositions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('portfolio_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    if (companies.length && !companies.find((c) => c.symbol === form.symbol)) {
      setForm((prev) => ({ ...prev, symbol: companies[0].symbol }));
    }
  }, [companies, form.symbol]);

  const submitTrade = (e) => {
    e.preventDefault();
    const qty = Number(form.qty);
    const price = Number(form.price);
    if (!qty || !price || qty < 0 || price < 0) return;

    setPositions((prev) => {
      const next = [...prev];
      const idx = next.findIndex((p) => p.symbol === form.symbol);
      const sign = form.side === 'buy' ? 1 : -1;
      if (idx === -1) {
        if (sign < 0) return prev;
        next.push({ symbol: form.symbol, qty, avgPrice: price, currentPrice: price });
        return next;
      }

      const pos = next[idx];
      const newQty = pos.qty + sign * qty;
      if (newQty <= 0) {
        next.splice(idx, 1);
        return next;
      }
      if (sign > 0) {
        const totalCost = pos.avgPrice * pos.qty + price * qty;
        pos.qty = newQty;
        pos.avgPrice = totalCost / newQty;
      } else {
        pos.qty = newQty;
      }
      pos.currentPrice = price;
      next[idx] = { ...pos };
      return next;
    });
  };

  const summary = useMemo(() => {
    let invested = 0;
    let current = 0;
    positions.forEach((p) => {
      invested += p.avgPrice * p.qty;
      current += p.currentPrice * p.qty;
    });
    const pnl = current - invested;
    return { invested, current, pnl };
  }, [positions]);

  return (
    <section className="portfolio-dashboard">
      <header>
        <h2>Portfolio</h2>
        <p>Track holdings, evaluate P/L, and simulate buy/sell actions.</p>
      </header>

      <div className="portfolio-summary">
        <div className="card"><span>Total Investment</span><strong>${summary.invested.toFixed(2)}</strong></div>
        <div className="card"><span>Current Value</span><strong>${summary.current.toFixed(2)}</strong></div>
        <div className="card"><span>Profit / Loss</span><strong className={summary.pnl >= 0 ? 'up' : 'down'}>${summary.pnl.toFixed(2)}</strong></div>
      </div>

      <div className="portfolio-grid">
        <form className="trade-form" onSubmit={submitTrade}>
          <h3>Mock Trade</h3>
          <label>Stock</label>
          <select value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))}>
            {companies.map((c) => <option key={c.symbol} value={c.symbol}>{c.symbol} - {c.name}</option>)}
          </select>
          <label>Quantity</label>
          <input type="number" min="1" value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))} />
          <label>Price</label>
          <input type="number" min="1" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
          <label>Action</label>
          <select value={form.side} onChange={(e) => setForm((p) => ({ ...p, side: e.target.value }))}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <button type="submit">Execute</button>
        </form>

        <div className="holdings">
          <h3>Holdings</h3>
          {positions.length === 0 ? <p className="empty">No positions yet.</p> : (
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>Current</th>
                  <th>P/L</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const pnl = (p.currentPrice - p.avgPrice) * p.qty;
                  return (
                    <tr key={p.symbol}>
                      <td>{p.symbol}</td>
                      <td>{p.qty}</td>
                      <td>${p.avgPrice.toFixed(2)}</td>
                      <td>${p.currentPrice.toFixed(2)}</td>
                      <td className={pnl >= 0 ? 'up' : 'down'}>${pnl.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

export default PortfolioDashboard;
