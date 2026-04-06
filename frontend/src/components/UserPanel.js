import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../authAPI';
import './UserPanel.css';

function UserPanel() {
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const profileData = await authAPI.getProfile(token);
      setUser(profileData);
      setWatchlist(profileData.watchlist || []);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      const token = localStorage.getItem('token');
      const response = await authAPI.removeFromWatchlist(token, symbol);
      setWatchlist(response.watchlist);
    } catch (err) {
      setError('Failed to remove from watchlist');
    }
  };

  if (loading) {
    return <div className="user-panel loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="user-panel error">{error}</div>;
  }

  if (!user) {
    return <div className="user-panel error">User not found</div>;
  }

  return (
    <div className="user-panel">
      <div className="user-header">
        <div className="user-avatar">{user.full_name.charAt(0).toUpperCase()}</div>
        <div className="user-info">
          <h2>{user.full_name}</h2>
          <p className="user-email">{user.email}</p>
          <p className="user-username">@{user.username}</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

      <div className="user-stats">
        <div className="stat-item">
          <span className="stat-label">Account Created</span>
          <span className="stat-value">{new Date(user.created_at).toLocaleDateString()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Watchlist Items</span>
          <span className="stat-value">{watchlist.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Notifications</span>
          <span className="stat-value">{user.notifications ? 'On' : 'Off'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Theme</span>
          <span className="stat-value">{user.theme === 'light' ? 'Light' : 'Dark'}</span>
        </div>
      </div>

      <div className="watchlist-section">
        <h3>My Watchlist</h3>
        {watchlist.length === 0 ? (
          <div className="empty-watchlist">
            <p>No stocks in your watchlist yet</p>
            <p className="hint">Add stocks from the dashboard to track them here</p>
          </div>
        ) : (
          <div className="watchlist-items">
            {watchlist.map((symbol) => (
              <div key={symbol} className="watchlist-item">
                <span className="symbol">{symbol}</span>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveFromWatchlist(symbol)}
                  title="Remove from watchlist"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="suggestions-section">
        <h3>Personalized Suggestions</h3>
        <div className="suggestions-grid">
          <div className="suggestion-card">
            <span className="suggestion-icon">TS</span>
            <h4>Trending Stocks</h4>
            <p>Track the most popular stocks today</p>
          </div>
          <div className="suggestion-card">
            <span className="suggestion-icon">WL</span>
            <h4>Your Watchlist</h4>
            <p>Monitor {watchlist.length} stocks in your list</p>
          </div>
          <div className="suggestion-card">
            <span className="suggestion-icon">AL</span>
            <h4>Market Alerts</h4>
            <p>Get notified of significant price changes</p>
          </div>
          <div className="suggestion-card">
            <span className="suggestion-icon">AN</span>
            <h4>Analysis</h4>
            <p>Deep dive into stock performance</p>
          </div>
        </div>
      </div>

      <div className="account-settings">
        <h3>Account Settings</h3>
        <div className="settings-item">
          <label>
            <input type="checkbox" checked={user.notifications} readOnly />
            <span>Enable Notifications</span>
          </label>
        </div>
        <div className="settings-item">
          <label>
            <span>Theme:</span>
            <select defaultValue={user.theme}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

export default UserPanel;
