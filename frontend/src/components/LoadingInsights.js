import React, { useState, useEffect } from 'react';
import './LoadingInsights.css';

const LoadingInsights = ({ query }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [marketIndicators, setMarketIndicators] = useState({
    volatility: 0,
    trend: 'neutral',
    volume: 0
  });
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [sentimentTimeline, setSentimentTimeline] = useState([]);

  const loadingTips = [
    "Analyzing market sentiment patterns...",
    "Scanning news sources for latest updates...",
    "Processing social media signals...",
    "Calculating confidence scores...",
    "Evaluating market volatility...",
    "Assessing trading volume trends..."
  ];

  const generateTrendSeries = (length = 7) => {
    const base = 45 + Math.random() * 10;
    return Array.from({ length }, (_, index) => {
      const variance = Math.sin(index / 1.5) * 8 + Math.random() * 8;
      return Math.max(12, Math.min(92, Math.round(base + variance)));
    });
  };

  const renderTrendSparkline = (data) => {
    const width = 220;
    const height = 56;
    const maxValue = Math.max(...data, 100);
    const minValue = Math.min(...data, 0);
    const stepX = width / (data.length - 1);

    const points = data.map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - minValue) / (maxValue - minValue || 1)) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="trend-chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline points={points} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="3" strokeLinecap="round" />
        {data.map((value, index) => {
          const x = index * stepX;
          const y = height - ((value - minValue) / (maxValue - minValue || 1)) * height;
          return <circle key={index} className="trend-dot" cx={x} cy={y} r="3" />;
        })}
      </svg>
    );
  };

  // Enhanced sentiment analyzer with more sophisticated logic
  const advancedSentimentAnalyzer = {
    analyze: (text) => {
      const positiveWords = [
        'bullish', 'surge', 'rally', 'gains', 'profit', 'beat', 'exceeds', 'strong',
        'growth', 'uptrend', 'momentum', 'breakthrough', 'outperform', 'upgrade',
        'positive', 'optimistic', 'confident', 'robust', 'solid', 'impressive'
      ];

      const negativeWords = [
        'bearish', 'decline', 'fall', 'loss', 'drop', 'miss', 'below', 'weak',
        'slump', 'downturn', 'concern', 'warning', 'downgrade', 'negative',
        'pessimistic', 'worried', 'challenging', 'disappointing', 'struggle'
      ];

      const neutralWords = [
        'stable', 'steady', 'unchanged', 'mixed', 'moderate', 'average', 'normal',
        'typical', 'standard', 'balanced', 'neutral', 'flat', 'sideways'
      ];

      const lowerText = text.toLowerCase();
      let positiveScore = 0;
      let negativeScore = 0;
      let neutralScore = 0;

      // Count word matches with regex for whole words
      positiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) positiveScore += matches.length;
      });

      negativeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) negativeScore += matches.length;
      });

      neutralWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) neutralScore += matches.length;
      });

      // Calculate sentiment
      const totalWords = text.split(' ').length;
      const maxScore = Math.max(positiveScore, negativeScore, neutralScore);

      let sentiment = 'neutral';
      let confidence = 0;

      if (maxScore > 0) {
        if (positiveScore === maxScore) {
          sentiment = 'positive';
          confidence = positiveScore / totalWords;
        } else if (negativeScore === maxScore) {
          sentiment = 'negative';
          confidence = negativeScore / totalWords;
        } else {
          sentiment = 'neutral';
          confidence = neutralScore / totalWords;
        }
      }

      return {
        sentiment,
        confidence: Math.min(confidence * 100, 100),
        score: positiveScore - negativeScore
      };
    }
  };

  // Generate realistic mock data based on stock symbol
  const generateMockData = (symbol) => {
    const mockNews = [
      {
        title: `${symbol} stock surges 5% after strong quarterly earnings report`,
        content: `Investors reacted positively as ${symbol} reported better-than-expected earnings, with revenue growth exceeding analyst estimates.`,
        source: 'Financial Times',
        type: 'news'
      },
      {
        title: `Analysts upgrade ${symbol} rating following product launch`,
        content: `Wall Street analysts have raised their price targets for ${symbol} following the successful launch of their new product line.`,
        source: 'Bloomberg',
        type: 'news'
      },
      {
        title: `${symbol} faces supply chain challenges in Q2 outlook`,
        content: `Company executives warned of potential delays due to ongoing supply chain disruptions affecting production.`,
        source: 'Reuters',
        type: 'news'
      },
      {
        title: `Market sentiment on ${symbol} remains cautiously optimistic`,
        content: `While short-term volatility persists, long-term investors maintain confidence in ${symbol}'s growth trajectory.`,
        source: 'CNBC',
        type: 'news'
      }
    ];

    const mockSocial = [
      {
        text: `Just bought more ${symbol} shares. The fundamentals look solid and the recent dip was a great buying opportunity. #investing #stocks`,
        author: '@StockTrader2026',
        type: 'social'
      },
      {
        text: `${symbol} earnings call was impressive. Management team showed clear strategic vision for the next fiscal year.`,
        author: '@ValueInvestor',
        type: 'social'
      },
      {
        text: `Concerned about ${symbol}'s exposure to international markets. Geopolitical tensions could impact their overseas operations.`,
        author: '@MarketWatcher',
        type: 'social'
      },
      {
        text: `Watching ${symbol} closely. The technical indicators suggest a potential breakout above resistance levels.`,
        author: '@TechAnalysis',
        type: 'social'
      }
    ];

    return [...mockNews, ...mockSocial];
  };

  const fetchData = async () => {
    setLoading(true);
    setAnalysisProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 800);

    try {
      setTrendData(generateTrendSeries());
      setSentimentTimeline([]);

      // In production, this would fetch from real APIs
      // For now, use enhanced mock data
      const mockData = generateMockData(query);

      const analyses = mockData.map((item, index) => {
        const text = item.title ? `${item.title} — ${item.content || item.text}` : item.text;
        const analysis = advancedSentimentAnalyzer.analyze(text);

        return {
          id: index,
          text: text.substring(0, 140) + (text.length > 140 ? '...' : ''),
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          score: analysis.score,
          source: item.source || item.author,
          type: item.type,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString()
        };
      });

      // Sort by confidence and take top 3 diverse insights
      const sorted = [...analyses].sort((a, b) => b.confidence - a.confidence);
      const diverse = [];

      // Ensure we have one of each sentiment type if possible
      const positive = sorted.find(a => a.sentiment === 'positive');
      const neutral = sorted.find(a => a.sentiment === 'neutral');
      const negative = sorted.find(a => a.sentiment === 'negative');

      if (positive) diverse.push(positive);
      if (neutral) diverse.push(neutral);
      if (negative) diverse.push(negative);

      // Make sure at least one news insight appears if available
      if (!diverse.some(item => item.type === 'news')) {
        const topNews = sorted.find(item => item.type === 'news');
        if (topNews) diverse.push(topNews);
      }

      // Fill remaining slots with highest confidence items
      sorted.forEach(item => {
        if (diverse.length < 3 && !diverse.find(d => d.id === item.id)) {
          diverse.push(item);
        }
      });

      // Calculate market indicators based on sentiment analysis
      const positiveCount = analyses.filter(a => a.sentiment === 'positive').length;
      const negativeCount = analyses.filter(a => a.sentiment === 'negative').length;
      const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

      const trend = positiveCount > negativeCount ? 'bullish' :
                   negativeCount > positiveCount ? 'bearish' : 'neutral';

      setMarketIndicators({
        volatility: Math.min(avgConfidence * 0.8 + Math.random() * 20, 100),
        trend,
        volume: Math.min(analyses.length * 10 + Math.random() * 30, 100)
      });

      setSentimentTimeline(analyses.slice(0, 4).map((item, index) => ({
        id: index,
        label: item.type === 'news' ? 'News pulse' : item.type === 'social' ? 'Social signal' : 'Analysis update',
        sentiment: item.sentiment
      })));

      setInsights(diverse.slice(0, 3));
      setAnalysisProgress(100);
    } catch (error) {
      console.error('Error fetching insights:', error);
      // Fallback mock data
      setInsights([
        {
          text: `Market analysis shows ${query} maintaining steady performance with moderate volatility.`,
          sentiment: 'neutral',
          confidence: 75,
          source: 'Market Analysis',
          type: 'analysis'
        }
      ]);
      setMarketIndicators({
        volatility: 45,
        trend: 'neutral',
        volume: 60
      });
      setAnalysisProgress(100);
    } finally {
      setTimeout(() => setLoading(false), 500); // Small delay for smooth transition
    }
  };

  useEffect(() => {
    if (query) {
      fetchData();
      const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [query]);

  const handleRefresh = () => {
    fetchData();
    setCurrentIndex(0);
  };

  const nextInsight = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
  };

  if (loading) {
    return (
      <div className="loading-insights">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>{loadingTips[currentTip]}</span>

          <div className="loading-details">
            <div className="trend-summary">
              <span className="summary-label">Live trend preview</span>
              {trendData.length > 0 ? renderTrendSparkline(trendData) : null}
            </div>
            <div className="loading-progress-bar">
              <div className="loading-progress-fill" style={{ width: `${analysisProgress}%` }} />
            </div>
            <span className="loading-progress-text">
              {Math.round(analysisProgress)}% Complete • {analysisProgress < 100 ? loadingTips[currentTip] : 'Finalizing insights...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="loading-insights">
        <div className="no-insights">
          No sentiment data available for {query}
        </div>
      </div>
    );
  }

  const currentInsight = insights[currentIndex];

  return (
    <div className="loading-insights">
      <div className="market-indicators">
        <div
          className="market-indicator"
          style={{
            background: marketIndicators.trend === 'bullish' ? '#10b981' :
                       marketIndicators.trend === 'bearish' ? '#ef4444' : '#6b7280'
          }}
          title={`Market Trend: ${marketIndicators.trend}`}
        ></div>
        <div
          className="market-indicator"
          style={{ background: '#f59e0b' }}
          title={`Volatility: ${Math.round(marketIndicators.volatility)}%`}
        ></div>
        <div
          className="market-indicator"
          style={{ background: '#8b5cf6' }}
          title={`Volume: ${Math.round(marketIndicators.volume)}%`}
        ></div>
      </div>

      <div className="insights-header">
        <h3>Market Sentiment Analysis</h3>
        <span className="stock-symbol">{query}</span>
      </div>

      <div className={`insight-notification ${currentInsight.sentiment}`}>
        <div className="sentiment-indicator">
          <div className="sentiment-icon">
            {currentInsight.sentiment === 'positive' ? '📈' :
             currentInsight.sentiment === 'negative' ? '📉' : '➡️'}
          </div>
          <div className="sentiment-label">
            {currentInsight.sentiment.toUpperCase()}
          </div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${currentInsight.confidence}%` }}
            ></div>
          </div>
          <span className="confidence-text">{Math.round(currentInsight.confidence)}%</span>
        </div>

        <div className="content">
          <p className="insight-text">{currentInsight.text}</p>
          <div className="insight-meta">
            <span className="source">{currentInsight.source}</span>
            <span className="timestamp">{currentInsight.timestamp}</span>
            <span className={`type-badge ${currentInsight.type}`}>
              {currentInsight.type}
            </span>
          </div>
        </div>

        <div className="navigation">
          <button onClick={nextInsight} className="nav-btn">
            Next ({currentIndex + 1}/{insights.length})
          </button>
        </div>
      </div>

      <div className="sentiment-timeline">
        {sentimentTimeline.map((item) => (
          <div key={item.id} className={`timeline-item ${item.sentiment}`}>
            <span className="timeline-dot"></span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="insights-footer">
        <button onClick={handleRefresh} className="refresh-btn">
          🔄 Refresh Analysis
        </button>
        <span className="auto-refresh">Auto-refresh: 10s</span>
      </div>
    </div>
  );
};

export default LoadingInsights;