import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { stockAPI } from './api';
import StockList from './components/StockList';
import StockDetail from './components/StockDetail';
import StockComparison from './components/StockComparison';
import TopStocks from './components/TopStocks';
import NavigationBar from './components/NavigationBar';
import SentimentAnalysis from './components/SentimentAnalysis';
import MarketNewsIntelligence from './components/MarketNewsIntelligence';
import WatchlistDashboard from './components/WatchlistDashboard';
import PortfolioDashboard from './components/PortfolioDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import './App.css';

function Dashboard() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

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

    fetchCompanies();
  }, []);

  if (loading) {
    return <div className="app-loading">Initializing dashboard...</div>;
  }

  return (
    <div className="App">
      <NavigationBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
            <WatchlistDashboard
              companies={companies}
              selectedStock={selectedStock}
              onSelectStock={setSelectedStock}
            />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-layout">
            <PortfolioDashboard companies={companies} />
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
            <AnalyticsDashboard symbol={selectedStock?.symbol} />
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
  return (
    <Router>
      <Routes>
        {/* Auth pages are bypassed to avoid blocking access */}
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Navigate to="/dashboard" replace />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
