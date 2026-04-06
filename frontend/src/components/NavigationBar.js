import React, { useState } from 'react';
import './NavigationBar.css';

const NavigationBar = ({
  activeTab,
  setActiveTab,
  setSelectedStock,
  companies
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', description: 'Stock Overview' },
    { id: 'topstocks', label: 'Top Stocks', description: 'Market Leaders' },
    { id: 'compare', label: 'Compare', description: 'Stock Analysis' },
    { id: 'watchlist', label: 'Watchlist', description: 'My Favorites' },
    { id: 'portfolio', label: 'Portfolio', description: 'My Investments' }
  ];

  const quickActions = [
    { id: 'sentiment', label: 'Sentiment', action: () => setActiveTab('sentiment') },
    { id: 'news', label: 'News', action: () => setActiveTab('news') },
    { id: 'analytics', label: 'Analytics', action: () => setActiveTab('analytics') }
  ];

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (company) => {
    setSelectedStock(company);
    setActiveTab('dashboard');
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-brand">
          <div className="brand-logo">
            <span className="logo-text">Jarnox</span>
          </div>
          <div className="brand-subtitle">Stock Dashboard</div>
        </div>

        <div className="nav-main">
          <div className="nav-tabs">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`nav-tab ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                title={item.description}
              >
                <span className="tab-label">{item.label}</span>
                {activeTab === item.id && <div className="tab-indicator"></div>}
              </button>
            ))}
          </div>
        </div>

        <div className="nav-search">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="search-input"
            />

            {showSearchResults && (
              <div className="search-results">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.slice(0, 5).map((company) => (
                    <div
                      key={company.symbol}
                      className="search-result-item"
                      onClick={() => handleSearchSelect(company)}
                    >
                      <div className="result-info">
                        <span className="result-symbol">{company.symbol}</span>
                        <span className="result-name">{company.name}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="search-no-results">No stocks found</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="nav-actions">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className="action-button"
              onClick={action.action}
              title={action.label}
            >
              <span className="action-icon">{action.label}</span>
            </button>
          ))}
        </div>

      </div>

      <button className="mobile-nav-toggle">
        <span className="toggle-icon">Menu</span>
      </button>
    </nav>
  );
};

export default NavigationBar;
