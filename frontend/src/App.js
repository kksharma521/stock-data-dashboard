import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { stockAPI } from './api';
import { authAPI } from './authAPI';
import StockList from './components/StockList';
import StockDetail from './components/StockDetail';
import StockComparison from './components/StockComparison';
import TopStocks from './components/TopStocks';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserPanel from './components/UserPanel';
import NavigationBar from './components/NavigationBar';
import SentimentAnalysis from './components/SentimentAnalysis';
import MarketNewsIntelligence from './components/MarketNewsIntelligence';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function Dashboard() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await stockAPI.getCompanies();
        setCompanies(data.companies);
        if (data.companies.length > 0) {
          setSelectedStock(data.companies[0]);
        }
      } catch (error) {
        console.error('Failed to load companies', error);
      } finally {
        setLoading(false);
      }
    };

    // Load user profile
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const profileData = await authAPI.getProfile(token);
          setUser(profileData);
        }
      } catch (error) {
        console.error('Failed to load user profile', error);
      }
    };

    fetchCompanies();
    loadUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowProfileMenu(false);
    // Navigate to login will be handled by ProtectedRoute
  };

  if (loading) {
    return <div className="app-loading">Initializing dashboard...</div>;
  }

  return (
    <div className="App">
      <NavigationBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        handleLogout={handleLogout}
        selectedStock={selectedStock}
        setSelectedStock={setSelectedStock}
        companies={companies}
      />

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard-shell">
            <aside className="dashboard-sidebar">
              <StockList onSelectStock={setSelectedStock} selectedSymbol={selectedStock} />
            </aside>
            <section className="dashboard-main-content">
              <StockDetail company={selectedStock} />
            </section>
          </div>
        )}

        {activeTab === 'topstocks' && (
          <div className="topstocks-layout">
            <TopStocks />
          </div>
        )}

        {activeTab === 'userpanel' && (
          <div className="userpanel-layout">
            <UserPanel />
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="compare-layout">
            <StockComparison companies={companies} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-layout">
            <div className="settings-content">
              <h2>Settings</h2>
              <p>Settings panel coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="watchlist-layout">
            <div className="watchlist-content">
              <h2>My Watchlist</h2>
              <p>Watchlist functionality coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-layout">
            <div className="portfolio-content">
              <h2>My Portfolio</h2>
              <p>Portfolio tracking coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-layout">
            <div className="alerts-content">
              <h2>Price Alerts</h2>
              <p>Alert system coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'sentiment' && (
          <div className="sentiment-layout">
            <SentimentAnalysis />
          </div>
        )}

        {activeTab === 'news' && (
          <div className="news-layout">
            <MarketNewsIntelligence symbol={selectedStock?.symbol || ''} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-layout">
            <div className="analytics-content">
              <h2>Advanced Analytics</h2>
              <p>Analytics dashboard coming soon...</p>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Stock Market Dashboard © 2026 | Data from Yahoo Finance</p>
      </footer>
    </div>
  );
}

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserPanel />
            </ProtectedRoute>
          }
        />

        {/* Redirect Logic */}
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
