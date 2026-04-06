import React, { useEffect, useRef, useState } from 'react';
import './NavigationBar.css';

const NavigationBar = ({
  activeTab,
  setActiveTab,
  user,
  showProfileMenu,
  setShowProfileMenu,
  handleLogout,
  selectedStock,
  setSelectedStock,
  companies
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const profileRef = useRef(null);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Stock Overview'
    },
    {
      id: 'topstocks',
      label: 'Top Stocks',
      icon: '🏆',
      description: 'Market Leaders'
    },
    {
      id: 'compare',
      label: 'Compare',
      icon: '⚖️',
      description: 'Stock Analysis'
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: '⭐',
      description: 'My Favorites'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: '💼',
      description: 'My Investments'
    }
  ];

  const quickActions = [
    {
      id: 'sentiment',
      label: 'Sentiment Analysis',
      icon: '🧠',
      action: () => setActiveTab('sentiment')
    },
    {
      id: 'news',
      label: 'News',
      icon: '📰',
      action: () => setActiveTab('news')
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      action: () => setActiveTab('analytics')
    }
  ];

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (company) => {
    setSelectedStock(company);
    setActiveTab('dashboard');
    setSearchQuery('');
    setShowSearchResults(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowProfileMenu]);

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        {/* Logo and Brand */}
        <div className="nav-brand">
          <div className="brand-logo">
            <span className="logo-icon">📈</span>
            <span className="logo-text">Jarnox</span>
          </div>
          <div className="brand-subtitle">Stock Dashboard</div>
        </div>

        {/* Main Navigation */}
        <div className="nav-main">
          <div className="nav-tabs">
            {navigationItems.map(item => (
              <button
                key={item.id}
                className={`nav-tab ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                title={item.description}
              >
                <span className="tab-icon">{item.icon}</span>
                <span className="tab-label">{item.label}</span>
                {activeTab === item.id && <div className="tab-indicator"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
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
            <span className="search-icon">🔍</span>

            {showSearchResults && (
              <div className="search-results">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.slice(0, 5).map(company => (
                    <div
                      key={company.symbol}
                      className="search-result-item"
                      onClick={() => handleSearchSelect(company)}
                    >
                      <div className="result-info">
                        <span className="result-symbol">{company.symbol}</span>
                        <span className="result-name">{company.name}</span>
                      </div>
                      <span className="result-arrow">→</span>
                    </div>
                  ))
                ) : (
                  <div className="search-no-results">
                    No stocks found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="nav-actions">
          {quickActions.map(action => (
            <button
              key={action.id}
              className="action-button"
              onClick={action.action}
              title={action.label}
            >
              <span className="action-icon">{action.icon}</span>
            </button>
          ))}
        </div>

        {/* User Profile */}
        <div className="nav-profile" ref={profileRef}>
          <button
            className="profile-button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              {user?.username ? user.username.charAt(0).toUpperCase() : '👤'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.username || 'User'}</span>
              <span className="profile-role">Premium</span>
            </div>
            <span className="profile-arrow">▼</span>
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {user?.username ? user.username.charAt(0).toUpperCase() : '👤'}
                </div>
                <div className="dropdown-user-info">
                  <div className="dropdown-name">{user?.full_name || 'User'}</div>
                  <div className="dropdown-email">{user?.email || ''}</div>
                </div>
              </div>

              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setActiveTab('userpanel');
                    setShowProfileMenu(false);
                  }}
                >
                  <span className="item-icon">📊</span>
                  <span>My Panel</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                >
                  <span className="item-icon">⚙️</span>
                  <span>Settings</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setActiveTab('watchlist');
                    setShowProfileMenu(false);
                  }}
                >
                  <span className="item-icon">⭐</span>
                  <span>Watchlist</span>
                </button>

                <div className="dropdown-divider"></div>

                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                >
                  <span className="item-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Toggle (for future mobile responsiveness) */}
      <button className="mobile-nav-toggle">
        <span className="toggle-icon">☰</span>
      </button>
    </nav>
  );
};

export default NavigationBar;
