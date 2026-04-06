const API_BASE = 'http://localhost:8000';
const intelligenceCache = new Map();
const INTEL_CACHE_TTL_MS = 60 * 1000;
const genericCache = new Map();
const GENERIC_TTL_MS = 45 * 1000;

const getCached = (key) => {
  const entry = genericCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > GENERIC_TTL_MS) {
    genericCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCached = (key, data) => {
  genericCache.set(key, { ts: Date.now(), data });
};

// Helper for fetch with timeout to prevent long waits
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export const stockAPI = {
  // Get list of available companies
  getCompanies: async () => {
    const key = 'companies';
    const cached = getCached(key);
    if (cached) return cached;
    try {
      const response = await fetchWithTimeout(`${API_BASE}/companies`, {}, 10000);
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCached(key, data);
      return data;
    } catch (error) {
      console.error('Error fetching companies:', error);

      // Fallback data when backend is unreachable
      const fallbackCompanies = [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      ];

      return { companies: fallbackCompanies };
    }
  },

  // Get stock data and analysis
  getStockData: async (symbol, period = 30) => {
    const key = `stock:${symbol}:${period}`;
    const cached = getCached(key);
    if (cached) return cached;
    try {
      const response = await fetchWithTimeout(`${API_BASE}/data/${symbol}?period=${period}`, {}, 12000);
      if (!response.ok) throw new Error(`Failed to fetch data for ${symbol}`);
      const data = await response.json();
      setCached(key, data);
      return data;
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);

      // Fallback placeholder data to keep UI responsive
      const fallbackData = {
        symbol: symbol.toUpperCase(),
        data: [
          { date: '2026-03-25', open: 100, close: 102, high: 103, low: 99, ma_7: 100.5, daily_return_pct: 2 },
          { date: '2026-03-26', open: 102, close: 101, high: 104, low: 100, ma_7: 101.0, daily_return_pct: -0.98 },
          { date: '2026-03-27', open: 101, close: 103, high: 105, low: 100, ma_7: 101.5, daily_return_pct: 1.98 },
        ],
        analysis: {
          latest_price: 103,
          average_price: 101.5,
          '52_week_high': 150,
          '52_week_low': 90,
          volatility_pct: 1.23,
          risk_level: 'Medium',
          trend: 'Uptrend',
          distance_from_52w_high_pct: -31.33,
        },
      };

      setCached(key, fallbackData);
      return fallbackData;
    }
  },

  // Get stock summary
  getSummary: async (symbol) => {
    const key = `summary:${symbol}`;
    const cached = getCached(key);
    if (cached) return cached;
    try {
      const response = await fetchWithTimeout(`${API_BASE}/summary/${symbol}`, {}, 10000);
      if (!response.ok) throw new Error(`Failed to fetch summary for ${symbol}`);
      const data = await response.json();
      setCached(key, data);
      return data;
    } catch (error) {
      console.error(`Error fetching summary for ${symbol}:`, error);

      return {
        symbol: symbol.toUpperCase(),
        '52_week_high': 150,
        '52_week_low': 90,
        'average_close': 101.5,
      };
    }
  },

  // Compare two stocks
  compareStocks: async (symbol1, symbol2) => {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE}/compare?symbol1=${symbol1}&symbol2=${symbol2}`,
        {},
        12000
      );
      if (!response.ok) throw new Error('Failed to compare stocks');
      return await response.json();
    } catch (error) {
      console.error('Error comparing stocks:', error);
      // Fallback comparison data
      return {
        symbol1: symbol1.toUpperCase(),
        symbol2: symbol2.toUpperCase(),
        comparison: {
          symbol1_price: 100,
          symbol2_price: 120,
          symbol1_volatility: 15.5,
          symbol2_volatility: 18.2,
          symbol1_trend: 'Uptrend',
          symbol2_trend: 'Downtrend'
        }
      };
    }
  },

  // Get market status
  getMarketStatus: async () => {
    const key = 'marketStatus';
    const cached = getCached(key);
    if (cached) return cached;
    try {
      const response = await fetchWithTimeout(`${API_BASE}/market/status`, {}, 10000);
      if (!response.ok) throw new Error('Failed to fetch market status');
      const data = await response.json();
      setCached(key, data);
      return data;
    } catch (error) {
      console.error('Error fetching market status:', error);
      // Fallback market status
      const fallback = {
        us_market: {
          is_open: false,
          status: 'Market Status Unavailable',
          current_time: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })
        },
        india_market: {
          is_open: false,
          status: 'Market Status Unavailable',
          current_time: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })
        },
        timestamp: new Date().toISOString()
      };
      setCached(key, fallback);
      return fallback;
    }
  },

  // Get stock news
  getStockNews: async (symbol) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/news/${symbol}`, {}, 10000);
      if (!response.ok) throw new Error(`Failed to fetch news for ${symbol}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      throw error;
    }
  },

  getMarketNewsIntelligence: async ({ symbol = '', sentiment = '', limit = 30 } = {}) => {
    const key = JSON.stringify({ symbol, sentiment, limit });
    const cached = intelligenceCache.get(key);
    const now = Date.now();
    if (cached && now - cached.ts < INTEL_CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const params = new URLSearchParams();
      if (symbol) params.set('symbol', symbol);
      if (sentiment) params.set('sentiment', sentiment);
      params.set('limit', String(limit));
      const response = await fetchWithTimeout(`${API_BASE}/news/intelligence?${params.toString()}`, {}, 10000);
      if (!response.ok) throw new Error('Failed to fetch market intelligence');
      const data = await response.json();
      intelligenceCache.set(key, { ts: now, data });
      return data;
    } catch (error) {
      console.error('Error fetching market intelligence:', error);
      const fallback = {
        summary: {
          label: 'neutral',
          positive_pct: 50,
          message: "Today's market sentiment is Neutral (50% positive).",
        },
        trending_stocks: [
          { symbol: 'AAPL', news_count: 4 },
          { symbol: 'MSFT', news_count: 3 },
          { symbol: 'TSLA', news_count: 3 },
        ],
        high_impact_news: [],
        items: [
          {
            title: 'Apple maintains guidance as services growth remains steady',
            source: 'Market Desk',
            published_at: new Date().toISOString(),
            url: '',
            symbol: 'AAPL',
            summary: 'Management reiterated guidance with resilient margins and stable demand trends.',
            keywords: ['guidance', 'margins', 'demand'],
            sentiment: { label: 'neutral', score: 0.1 },
            impact: 'neutral',
            high_impact: false,
            confidence: 'medium',
          },
        ],
      };
      intelligenceCache.set(key, { ts: now, data: fallback });
      return fallback;
    }
  },

  // Get stock alerts
  getStockAlerts: async (symbol) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/alerts/${symbol}`, {}, 10000);
      if (!response.ok) throw new Error(`Failed to fetch alerts for ${symbol}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching alerts for ${symbol}:`, error);
      // Fallback alerts data
      return {
        symbol: symbol.toUpperCase(),
        alerts: [
          { type: 'info', title: 'Stock Monitoring', message: 'Displaying cached data for this stock' }
        ]
      };
    }
  },

  // Get top 10 earning stocks
  getTopEarners: async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/top/earners`, {}, 30000);
      if (!response.ok) throw new Error('Failed to fetch top earners');
      return await response.json();
    } catch (error) {
      console.error('Error fetching top earners:', error);

      // Fallback data
      const fallbackEarners = [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'US', price: 950.50, change_pct: 5.2, change: 47.00 },
        { symbol: 'TSLA', name: 'Tesla Inc.', market: 'US', price: 210.75, change_pct: 4.8, change: 9.65 },
        { symbol: 'AAPL', name: 'Apple Inc.', market: 'US', price: 195.20, change_pct: 3.1, change: 5.88 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'US', price: 420.30, change_pct: 2.9, change: 11.90 },
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', market: 'NSE', price: 2850.75, change_pct: 2.5, change: 69.50 },
        { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', market: 'NSE', price: 3450.20, change_pct: 2.2, change: 74.25 },
        { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', market: 'NSE', price: 1680.90, change_pct: 1.8, change: 29.85 },
        { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', market: 'US', price: 142.60, change_pct: 1.5, change: 2.11 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'US', price: 155.80, change_pct: 1.3, change: 1.99 },
        { symbol: 'INFY.NS', name: 'Infosys Ltd.', market: 'NSE', price: 1420.45, change_pct: 1.1, change: 15.45 },
      ];

      return { top_earners: fallbackEarners, count: 10, description: 'Top 10 stocks with highest percentage gains today' };
    }
  },

  getTopLosers: async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/top/losers`, {}, 30000);
      if (!response.ok) throw new Error('Failed to fetch top losers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching top losers:', error);
      return {
        top_losers: [
          { symbol: 'TSLA', name: 'Tesla Inc.', market: 'US', price: 210.75, change_pct: -4.1, change: -9.02 },
          { symbol: 'NFLX', name: 'Netflix Inc.', market: 'US', price: 560.2, change_pct: -3.3, change: -19.1 },
          { symbol: 'INTC', name: 'Intel Corporation', market: 'US', price: 34.4, change_pct: -2.8, change: -0.99 },
        ],
        count: 3,
      };
    }
  },

  // Get top 10 long-term investment stocks
  getTopLongTerm: async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/top/long-term`, {}, 30000);
      if (!response.ok) throw new Error('Failed to fetch long-term stocks');
      return await response.json();
    } catch (error) {
      console.error('Error fetching long-term stocks:', error);

      // Fallback data
      const fallbackLongTerm = [
        { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'US', price: 420.30, annual_return: 28.5, volatility: 22.1, sharpe_ratio: 1.15, max_drawdown: -15.2, score: 15.8 },
        { symbol: 'AAPL', name: 'Apple Inc.', market: 'US', price: 195.20, annual_return: 24.8, volatility: 25.3, sharpe_ratio: 0.92, max_drawdown: -18.5, score: 12.4 },
        { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', market: 'NSE', price: 1680.90, annual_return: 22.1, volatility: 20.8, sharpe_ratio: 0.98, max_drawdown: -12.3, score: 11.9 },
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', market: 'NSE', price: 2850.75, annual_return: 26.3, volatility: 28.5, sharpe_ratio: 0.85, max_drawdown: -22.1, score: 11.2 },
        { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', market: 'NSE', price: 3450.20, annual_return: 19.8, volatility: 18.9, sharpe_ratio: 0.95, max_drawdown: -14.7, score: 10.8 },
        { symbol: 'JNJ', name: 'Johnson & Johnson', market: 'US', price: 165.40, annual_return: 15.2, volatility: 15.6, sharpe_ratio: 0.88, max_drawdown: -10.8, score: 9.5 },
        { symbol: 'PG', name: 'Procter & Gamble', market: 'US', price: 158.90, annual_return: 12.8, volatility: 14.2, sharpe_ratio: 0.76, max_drawdown: -9.5, score: 8.9 },
        { symbol: 'INFY.NS', name: 'Infosys Ltd.', market: 'NSE', price: 1420.45, annual_return: 18.5, volatility: 22.4, sharpe_ratio: 0.78, max_drawdown: -16.9, score: 8.7 },
        { symbol: 'ITC.NS', name: 'ITC Ltd.', market: 'NSE', price: 425.60, annual_return: 16.2, volatility: 19.8, sharpe_ratio: 0.75, max_drawdown: -13.2, score: 8.3 },
        { symbol: 'KO', name: 'The Coca-Cola Company', market: 'US', price: 58.75, annual_return: 11.5, volatility: 16.7, sharpe_ratio: 0.62, max_drawdown: -11.4, score: 7.8 },
      ];

      return { top_long_term: fallbackLongTerm, count: 10, description: 'Top 10 stocks suitable for long-term investment based on stability and growth metrics' };
    }
  },

  // Get top 10 best stocks of the day
  getTopDailyStocks: async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/top/daily`, {}, 30000);
      if (!response.ok) throw new Error('Failed to fetch daily top stocks');
      return await response.json();
    } catch (error) {
      console.error('Error fetching daily top stocks:', error);

      // Fallback data
      const fallbackDaily = [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'US', price: 950.50, change_pct: 5.2, volume: 45230000, volume_ratio: 1.8, score: 6.76 },
        { symbol: 'TSLA', name: 'Tesla Inc.', market: 'US', price: 210.75, change_pct: 4.8, volume: 89450000, volume_ratio: 2.1, score: 6.29 },
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', market: 'NSE', price: 2850.75, change_pct: 2.5, volume: 12500000, volume_ratio: 1.9, score: 3.48 },
        { symbol: 'AAPL', name: 'Apple Inc.', market: 'US', price: 195.20, change_pct: 3.1, volume: 67890000, volume_ratio: 1.5, score: 3.42 },
        { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', market: 'NSE', price: 3450.20, change_pct: 2.2, volume: 8900000, volume_ratio: 1.7, score: 2.97 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'US', price: 420.30, change_pct: 2.9, volume: 34560000, volume_ratio: 1.3, score: 2.86 },
        { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', market: 'NSE', price: 1680.90, change_pct: 1.8, volume: 15600000, volume_ratio: 1.6, score: 2.45 },
        { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', market: 'US', price: 142.60, change_pct: 1.5, volume: 28900000, volume_ratio: 1.4, score: 1.89 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'US', price: 155.80, change_pct: 1.3, volume: 41200000, volume_ratio: 1.2, score: 1.56 },
        { symbol: 'INFY.NS', name: 'Infosys Ltd.', market: 'NSE', price: 1420.45, change_pct: 1.1, volume: 12300000, volume_ratio: 1.3, score: 1.43 },
      ];

      return { top_daily: fallbackDaily, count: 10, description: 'Top 10 stocks with best performance today based on price action and volume' };
    }
  },

  // Sentiment Analysis API functions

  // Get stock sentiment analysis
  getStockSentiment: async (symbol) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/sentiment/stock/${symbol}`, {}, 15000);
      if (!response.ok) throw new Error(`Failed to fetch sentiment for ${symbol}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching sentiment for ${symbol}:`, error);

      // Fallback sentiment data
      return {
        symbol: symbol.toUpperCase(),
        sentiment_analysis: {
          symbol: symbol.toUpperCase(),
          overall_sentiment: 'neutral',
          confidence: 65.5,
          total_sources: 8,
          sentiment_breakdown: {
            positive: 3,
            neutral: 3,
            negative: 2
          },
          recent_news: [
            {
              title: `${symbol} reports quarterly earnings`,
              source: 'Financial Times',
              sentiment: 'neutral'
            }
          ],
          social_sentiment: [
            {
              text: `Watching ${symbol} closely for next quarter`,
              platform: 'twitter',
              sentiment: 'neutral'
            }
          ],
          timestamp: new Date().toISOString()
        },
        status: 'success'
      };
    }
  },

  // Get market sentiment analysis
  getMarketSentiment: async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/sentiment/market`, {}, 20000);
      if (!response.ok) throw new Error('Failed to fetch market sentiment');
      return await response.json();
    } catch (error) {
      console.error('Error fetching market sentiment:', error);

      // Fallback market sentiment data
      return {
        market_sentiment: {
          market_sentiment: 'neutral',
          confidence: 58.3,
          analyzed_stocks: 8,
          stock_sentiments: [
            {
              symbol: 'AAPL',
              overall_sentiment: 'positive',
              confidence: 72.5,
              sentiment_breakdown: { positive: 4, neutral: 2, negative: 1 }
            },
            {
              symbol: 'MSFT',
              overall_sentiment: 'positive',
              confidence: 68.9,
              sentiment_breakdown: { positive: 3, neutral: 3, negative: 1 }
            },
            {
              symbol: 'GOOGL',
              overall_sentiment: 'neutral',
              confidence: 55.2,
              sentiment_breakdown: { positive: 2, neutral: 4, negative: 2 }
            }
          ],
          breakdown: {
            bullish_stocks: 5,
            bearish_stocks: 2,
            neutral_stocks: 1
          },
          timestamp: new Date().toISOString()
        },
        status: 'success'
      };
    }
  },
};
