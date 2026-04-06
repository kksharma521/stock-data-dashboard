# 📈 Advanced Stock Market Dashboard

A sophisticated financial dashboard built with React and FastAPI, featuring multiple chart types, real-time stock data, and advanced technical analysis.

## ✨ Features

### 🎨 Advanced Visualizations
- **Candlestick Charts** - Professional OHLC visualization with wicks and bodies
- **Line Charts** - Price trends with 7-day moving average overlay
- **Area Charts** - Gradient-filled price data visualization
- **Bar Charts** - Price and moving average comparison
- **Return Charts** - Daily percentage returns analysis

### 📊 Dashboard Features
- **Real-time Stock Data** - Live prices from Yahoo Finance
- **Multiple Time Periods** - 7 days to 1 year data selection
- **Advanced Metrics Panel**
  - Current, average, high, and low prices
  - 52-week highs/lows with distance calculation
  - Volatility percentage and risk classification
  - Trend detection (Uptrend/Downtrend)
  
### 🔄 Stock Comparison
- Side-by-side comparison of any two stocks
- Return percentage analysis
- Volatility comparison
- AI-powered insights and recommendations
- Winner indicator for better performer

### 💡 Technical Analysis
- 7-day moving average calculations
- Daily return percentage tracking
- Volatility measurements
- Risk level classification (Low/Medium/High)
- Distance from 52-week highs calculation

### 🎯 UI/UX Enhancements
- Beautiful gradient design system
- Smooth animations and transitions
- Responsive layout (Desktop, Tablet, Mobile)
- Dark mode compatible
- Interactive charts with Recharts library
- Professional color palette
- Loading and error states with emojis
- Sticky navigation and sidebars

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Installation

1. **Backend Setup**
```bash
cd stock-dashboard
python -m venv venv
```

On Windows:
```bash
venv\Scripts\Activate
```

On macOS/Linux:
```bash
source venv/bin/activate
```

2. **Install Backend Dependencies**
```bash
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

### Running the Application

**Terminal 1 - Start Backend:**
```bash
cd stock-dashboard
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

**Terminal 2 - Start Frontend:**
```bash
cd stock-dashboard/frontend
npm start
```

Frontend will open at: `http://localhost:3000` (or `http://localhost:3001` if port 3000 is busy)

## 📁 Project Structure

```
stock-dashboard/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI endpoints
│   ├── services.py          # Stock data fetching & analysis
│   └── utils.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdvancedChart.js      # Multi-chart component
│   │   │   ├── AdvancedMetrics.js    # Enhanced metrics panel
│   │   │   ├── StockDetail.js        # Main stock detail view
│   │   │   ├── StockChart.js         # Chart wrapper
│   │   │   ├── StockComparison.js    # Comparison tool
│   │   │   └── StockList.js          # Stock selector
│   │   ├── api.js                    # API service
│   │   ├── App.js                    # Main app component
│   │   └── index.js
│   └── package.json
├── requirements.txt
└── README.md
```

## 🎨 Chart Types

### 1. Candlestick Charts
- Open, High, Low, Close visualization
- Green bars for uptrends, red for downtrends
- Professional financial charting
- Ideal for day traders and technical analysts

### 2. Line Charts
- Smooth price trends
- 7-day moving average overlay
- Multiple data series support
- Perfect for trend analysis

### 3. Area Charts
- Gradient-filled visualization
- Price trends with volume feel
- Beautiful aesthetic
- Good for long-term trends

### 4. Bar Charts
- Price and MA comparison
- Easy-to-read format
- Supports multiple metrics
- Great for period comparisons

### 5. Daily Returns
- Percentage change visualization
- Positive (green) and negative (red) returns
- Volatility indication
- Risk assessment tool

## 📊 Available Stocks

Default stocks included:
- 🍎 AAPL (Apple)
- 🪟 MSFT (Microsoft)
- 🔍 GOOG (Google)
- ⚡ TSLA (Tesla)

Add more by modifying `/app/services.py`

## 🔧 API Endpoints

### GET `/companies`
Returns list of available stock symbols

**Response:**
```json
{
  "companies": ["AAPL", "MSFT", "GOOG", "TSLA"]
}
```

### GET `/data/{symbol}`
Fetches stock data with analysis

**Parameters:**
- `symbol` (string): Stock ticker
- `period` (int): Days of history (default: 30)

**Response:**
```json
{
  "symbol": "AAPL",
  "data": [...],
  "analysis": {
    "latest_price": 150.25,
    "average_price": 148.50,
    "52_week_high": 199.62,
    "52_week_low": 124.17,
    "volatility_pct": 2.45,
    "risk_level": "Medium",
    "trend": "Uptrend",
    "distance_from_52w_high_pct": -24.78
  }
}
```

### GET `/compare`
Compares two stocks

**Parameters:**
- `symbol1` (string): First stock ticker
- `symbol2` (string): Second stock ticker

**Response:**
```json
{
  "symbol1": "AAPL",
  "symbol2": "MSFT",
  "comparison": {
    "return_symbol1": 15.25,
    "return_symbol2": 8.50,
    "better_performer": "AAPL",
    "more_volatile": "TSLA",
    "insight": "AAPL significantly outperformed the other stock"
  }
}
```

### GET `/summary/{symbol}`
Quick stock summary

### GET `/data/{symbol}?period=90`
Extended data period support

## 🎨 Customization

### Adding New Chart Types
Edit `AdvancedChart.js` and add new chart components following the Recharts pattern.

### Changing Colors
Update the gradient colors in CSS files or modify `App.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Modifying Stock List
Edit `/app/services.py`:
```python
def get_companies():
    return ["AAPL", "MSFT", "GOOG", "TSLA", "YOUR_SYMBOL"]
```

## 📱 Responsive Design

The dashboard is fully responsive:
- **Desktop** (1024px+): 2-column layout with sidebar
- **Tablet** (768px-1023px): Adjusted grid
- **Mobile** (< 768px): Single column layout

## 🔐 Security Notes

- CORS is currently set to allow all origins (`["*"]`)
- For production, specify exact origins
- Implement authentication for API endpoints
- Add rate limiting to prevent abuse

## 🐛 Troubleshooting

### Backend won't start
```bash
# Make sure venv is activated
source venv/bin/activate  # or venv\Scripts\Activate on Windows

# Reinstall dependencies
pip install -r requirements.txt

# Check port 8000
lsof -i :8000
```

### Frontend won't connect to backend
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in `app/main.py`
- Clear browser cache

### Charts not showing
- Check browser console for errors
- Verify data is being fetched (check Network tab)
- Ensure Recharts is installed: `npm install recharts --save`

## 📈 Future Enhancements

- [ ] Cryptocurrency support
- [ ] Portfolio tracking
- [ ] Custom indicators (RSI, MACD)
- [ ] Price alerts
- [ ] News integration
- [ ] Historical backtesting
- [ ] Dark mode toggle
- [ ] Export to PDF/CSV
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## 📝 Dependencies

**Backend:**
- FastAPI: Web framework
- Uvicorn: ASGI server
- Yfinance: Stock data
- Pandas: Data analysis
- NumPy: Numerical computing

**Frontend:**
- React: UI library
- Recharts: Advanced charting
- Lucide React: Icons (optional)

## 📄 License

MIT License - Feel free to use this project for personal or commercial use.

## 👨‍💻 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Review backend logs

---

**Made with ❤️ by Your Dashboard Team**

Last Updated: April 2026
