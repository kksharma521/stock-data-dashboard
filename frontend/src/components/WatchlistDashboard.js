import React, { useEffect, useMemo, useState } from 'react';
import './WatchlistDashboard.css';

function WatchlistDashboard({ companies = [], selectedStock, onSelectStock }) {
  const [watchlist, setWatchlist] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('watchlist_symbols');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('watchlist_symbols', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatch = (symbol) => {
    setWatchlist((prev) => (prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]));
  };

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [companies, search]);

  const watchlistCompanies = useMemo(
    () => companies.filter((c) => watchlist.includes(c.symbol)),
    [companies, watchlist]
  );

  return (
    <section className="watchlist-dashboard">
      <header>
        <h2>Watchlist</h2>
        <p>Track your priority stocks with quick access and alerts.</p>
      </header>

      <div className="watchlist-grid">
        <div className="watchlist-panel">
          <h3>My Watchlist ({watchlistCompanies.length})</h3>
          {watchlistCompanies.length === 0 ? (
            <p className="empty">No stocks added yet.</p>
          ) : (
            watchlistCompanies.map((c) => (
              <div key={c.symbol} className="watch-item">
                <button onClick={() => onSelectStock?.(c)}>{c.symbol} - {c.name}</button>
                <span className="alert-pill">Alert Active</span>
                <button className="remove" onClick={() => toggleWatch(c.symbol)}>Remove</button>
              </div>
            ))
          )}
        </div>

        <div className="watchlist-panel">
          <h3>Add/Remove Stocks</h3>
          <input
            type="text"
            placeholder="Search ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="stock-list-mini">
            {filteredCompanies.slice(0, 20).map((c) => {
              const inWatch = watchlist.includes(c.symbol);
              return (
                <div key={c.symbol} className="stock-row">
                  <span>{c.symbol}</span>
                  <span>{c.name}</span>
                  <button onClick={() => toggleWatch(c.symbol)}>{inWatch ? 'Remove' : 'Add'}</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedStock && (
        <div className="quick-access">
          <span>Quick Access:</span>
          <strong>{selectedStock.symbol}</strong>
          <button onClick={() => toggleWatch(selectedStock.symbol)}>
            {watchlist.includes(selectedStock.symbol) ? 'Remove from Watchlist' : 'Add Current Stock'}
          </button>
        </div>
      )}
    </section>
  );
}

export default WatchlistDashboard;
