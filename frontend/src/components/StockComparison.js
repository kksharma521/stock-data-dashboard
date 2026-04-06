import React, { useState, useEffect } from 'react';
import { stockAPI } from '../api';
import './StockComparison.css';

function StockComparison({ companies }) {
  const [symbol1, setSymbol1] = useState('');
  const [symbol2, setSymbol2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companies || companies.length === 0) return;

    const defaultSymbol1 = companies[0]?.symbol || companies[0] || '';
    const defaultSymbol2 = companies.length > 1 ? (companies[1]?.symbol || companies[1] || '') : defaultSymbol1;

    setSymbol1(prev => prev || defaultSymbol1);
    setSymbol2(prev => prev || (defaultSymbol2 !== defaultSymbol1 ? defaultSymbol2 : companies[0]?.symbol || companies[0] || ''));
  }, [companies]);

  useEffect(() => {
    if (symbol1 && symbol2 && symbol1 !== symbol2) {
      const fetchComparison = async () => {
        try {
          setLoading(true);
          const data = await stockAPI.compareStocks(symbol1, symbol2);
          setComparison(data);
          setError(null);
        } catch (err) {
          setError('Failed to compare stocks');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchComparison();
    } else {
      setComparison(null);
    }
  }, [symbol1, symbol2]);

  return (
    <div className="stock-comparison">
      <div className="comparison-header">
        <h2>📊 Compare Stocks</h2>
        <p>Side-by-side analysis of two stocks</p>
      </div>

      <div className="comparison-selectors">
        <div className="selector-group">
          <label>First Stock:</label>
          <select value={symbol1} onChange={(e) => setSymbol1(e.target.value)}>
            {companies.map((c) => {
              const symbol = typeof c === 'string' ? c : c.symbol;
              const name = typeof c === 'string' ? c : c.name;
              return (
                <option key={symbol} value={symbol}>
                  {symbol} - {name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="vs-text">VS</div>

        <div className="selector-group">
          <label>Second Stock:</label>
          <select value={symbol2} onChange={(e) => setSymbol2(e.target.value)}>
            {companies.map((c) => {
              const symbol = typeof c === 'string' ? c : c.symbol;
              const name = typeof c === 'string' ? c : c.name;
              return (
                <option key={symbol} value={symbol}>
                  {symbol} - {name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {loading && <div className="comparison-loading">⏳ Analyzing stocks...</div>}
      {error && <div className="comparison-error">❌ {error}</div>}

      {comparison && symbol1 !== symbol2 && (
        <div className="comparison-results">
          <div className="comparison-grid">
            <div className="comparison-card winner">
              <div className="card-header">
                <h3>{comparison.symbol1}</h3>
                {comparison.comparison.better_performer === comparison.symbol1 && (
                  <span className="winner-badge">🏆 Leader</span>
                )}
              </div>
              
              <div className="metric">
                <div className="label">Return</div>
                <div className={`value ${comparison.comparison.return_symbol1 >= 0 ? 'positive' : 'negative'}`}>
                  {comparison.comparison.return_symbol1 >= 0 ? '+' : ''}
                  {comparison.comparison.return_symbol1}%
                </div>
              </div>

              <div className="metric">
                <div className="label">More Volatile</div>
                <div className={`value ${comparison.comparison.more_volatile === comparison.symbol1 ? 'alert' : 'neutral'}`}>
                  {comparison.comparison.more_volatile === comparison.symbol1 ? '⚠️ Yes' : '✓ No'}
                </div>
              </div>
            </div>

            <div className="comparison-divider"></div>

            <div className="comparison-card">
              <div className="card-header">
                <h3>{comparison.symbol2}</h3>
                {comparison.comparison.better_performer === comparison.symbol2 && (
                  <span className="winner-badge">🏆 Leader</span>
                )}
              </div>

              <div className="metric">
                <div className="label">Return</div>
                <div className={`value ${comparison.comparison.return_symbol2 >= 0 ? 'positive' : 'negative'}`}>
                  {comparison.comparison.return_symbol2 >= 0 ? '+' : ''}
                  {comparison.comparison.return_symbol2}%
                </div>
              </div>

              <div className="metric">
                <div className="label">More Volatile</div>
                <div className={`value ${comparison.comparison.more_volatile === comparison.symbol2 ? 'alert' : 'neutral'}`}>
                  {comparison.comparison.more_volatile === comparison.symbol2 ? '⚠️ Yes' : '✓ No'}
                </div>
              </div>
            </div>
          </div>

          <div className="comparison-summary">
            <h3>📈 Comparison Summary</h3>
            <div className="summary-items">
              <div className="summary-item">
                <div className="summary-label">
                  <span className="icon">🏆</span>
                  Better Performer
                </div>
                <div className="summary-content">
                  <span className="value-badge">
                    {comparison.comparison.better_performer === 'Equal' 
                      ? '⚖️ Equal' 
                      : comparison.comparison.better_performer}
                  </span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-label">
                  <span className="icon">📊</span>
                  Volatility Comparison
                </div>
                <div className="summary-content">
                  <span className="value-badge">
                    {comparison.comparison.more_volatile === 'Equal'
                      ? '⚖️ Similar'
                      : `${comparison.comparison.more_volatile} is more volatile`}
                  </span>
                </div>
              </div>

              <div className="summary-item full-width">
                <div className="summary-label">
                  <span className="icon">💡</span>
                  Insight
                </div>
                <div className="summary-content">
                  <p>{comparison.comparison.insight}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {symbol1 === symbol2 && (
        <div className="comparison-message">
          🔄 Please select two different stocks to compare
        </div>
      )}
    </div>
  );
}

export default StockComparison;
