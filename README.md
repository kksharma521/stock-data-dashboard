# Stock Data Dashboard

A production-ready financial intelligence platform built on your existing stock dashboard architecture.

## What It Delivers

- Real-time stock data APIs (FastAPI + yFinance)
- Professional charting with fullscreen, zoom, and range controls
- Market News Intelligence with sentiment + impact inference
- Dynamic Smart Insights per stock (trend, MA context, volatility, sentiment)
- Top movers intelligence (gainers + losers)
- Watchlist with persistence and quick access workflow
- Portfolio module with mock buy/sell, holdings, and P/L tracking
- Advanced analytics panel (trend, MA, volatility views)
- Upgraded sentiment intelligence dashboard with drill-down and source/keyword breakdowns

## Architecture

This project was upgraded in place, not rebuilt. Existing services, endpoints, and component structure were extended and stabilized.

- Backend: FastAPI, Pandas, yFinance
- Frontend: React, ApexCharts, Recharts
- Data flow: modular service layer (`frontend/src/api.js`) with fallback handling and caching

## Core APIs

Backend endpoints used by the platform:

- `GET /companies`
- `GET /data/{symbol}`
- `GET /summary/{symbol}`
- `GET /compare?symbol1=&symbol2=`
- `GET /news/{symbol}`
- `GET /news/intelligence`
- `GET /top/earners`
- `GET /top/losers`
- `GET /top/long-term`
- `GET /top/daily`

## Intelligence Features

### Market News Intelligence

- Structured cards with ticker, sentiment, impact, summary, confidence, keywords
- High-impact highlights
- Trending stocks by news frequency
- Filter fallback logic: if strict filter returns empty, general market intelligence is shown automatically
- Click-through detail modal + source links

### Smart Insights (Dynamic)

Insights are generated per selected stock using:

- Latest price vs MA(7)
- Day-over-day momentum
- Volatility profile
- News sentiment regime and keywords

### Sentiment Dashboard

- Market sentiment distribution charts
- Per-stock confidence visualizations
- Click stock to open detailed view:
  - sentiment percentages
  - source breakdown
  - key keyword drivers
  - related news context

## Dashboard Modules

- Sidebar stock universe + search
- Main stock intelligence view
- Top stocks intelligence with optimized fetching and skeleton loading
- Stock comparison with corrected metrics and dual-series chart
- Watchlist dashboard with persistence
- Portfolio dashboard (mock trading + holdings + P/L)
- Advanced analytics panel replacing placeholder content

## Data Sources

- Yahoo Finance (market data)
- Configured news provider path (Finnhub when API key is set)
- Resilient fallback datasets for offline/degraded scenarios

## Local Development

### Backend

```bash
cd app
.venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend default URL: `http://localhost:3000`

## Environment Variables

Optional but recommended:

- `FINNHUB_API_KEY` for live news intelligence feed
- `REACT_APP_AUTH_API_BASE` for auth backend base URL

## Verification

Build and syntax checks used:

```bash
cd frontend
npm run build

cd ..
app\.venv\Scripts\python -c "import py_compile; py_compile.compile('app/main.py', doraise=True); py_compile.compile('app/services.py', doraise=True)"
```

## License

Internal/prototyping use. Add a formal OSS license before public distribution.
