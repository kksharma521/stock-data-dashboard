import React, { useState, useEffect } from 'react';
import { stockAPI } from '../api';
import './StockList.css';

function StockList({ onSelectStock, selectedSymbol }) {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const data = await stockAPI.getCompanies();
        setCompanies(data.companies);
        setFilteredCompanies(data.companies);
        setError(null);
      } catch (err) {
        setError('Failed to load companies');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleSearch = (value) => {
    setSearchQuery(value);
    
    if (value.trim() === '') {
      setFilteredCompanies(companies);
      setShowSuggestions(false);
    } else {
      const query = value.toLowerCase();
      const filtered = companies.filter(company => 
        company.symbol.toLowerCase().includes(query) || 
        company.name.toLowerCase().includes(query)
      );
      setFilteredCompanies(filtered);
      setShowSuggestions(true);
    }
  };

  const handleSelectStock = (company) => {
    onSelectStock(company);
    setSearchQuery('');
    setShowSuggestions(false);
    setFilteredCompanies(companies);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setFilteredCompanies(companies);
  };

  if (loading) return <div className="stock-list loading">Loading companies...</div>;
  if (error) return <div className="stock-list error">{error}</div>;

  const displayedCompanies = showSuggestions ? filteredCompanies : companies;
  const selectedCompany = typeof selectedSymbol === 'string' 
    ? companies.find(c => c.symbol === selectedSymbol)
    : selectedSymbol;

  return (
    <div className="stock-list">
      <h2>📊 Available Stocks</h2>
      
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-button" 
              onClick={handleClearSearch}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        
        {showSuggestions && filteredCompanies.length > 0 && (
          <div className="suggestions-dropdown">
            <div className="suggestions-count">
              {filteredCompanies.length} result{filteredCompanies.length !== 1 ? 's' : ''}
            </div>
            {filteredCompanies.slice(0, 8).map((company) => (
              <button
                key={company.symbol}
                className="suggestion-item"
                onClick={() => handleSelectStock(company)}
              >
                <span className="suggestion-symbol">{company.symbol}</span>
                <span className="suggestion-name">{company.name}</span>
              </button>
            ))}
            {filteredCompanies.length > 8 && (
              <div className="suggestions-more">
                +{filteredCompanies.length - 8} more
              </div>
            )}
          </div>
        )}

        {showSuggestions && filteredCompanies.length === 0 && searchQuery && (
          <div className="suggestions-empty">
            No stocks found for "{searchQuery}"
          </div>
        )}
      </div>

      {selectedCompany && (
        <div className="selected-stock-badge">
          <span className="badge-label">Selected:</span>
          <span className="badge-symbol">{selectedCompany.symbol}</span>
          <span className="badge-name">{selectedCompany.name}</span>
        </div>
      )}

      <h3 className="all-stocks-title">All Stocks</h3>
      <div className="stock-list-container">
        {displayedCompanies.map((company) => {
          const isActive = typeof selectedSymbol === 'string' 
            ? selectedSymbol === company.symbol 
            : selectedSymbol?.symbol === company.symbol;
          
          return (
            <button
              key={company.symbol}
              className={`stock-button ${isActive ? 'active' : ''}`}
              onClick={() => handleSelectStock(company)}
              title={company.name}
            >
              <span className="symbol">{company.symbol}</span>
              <span className="name">{company.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {displayedCompanies.length === 0 && !showSuggestions && (
        <div className="no-stocks">No stocks available</div>
      )}
    </div>
  );
}

export default StockList;
