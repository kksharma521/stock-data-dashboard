# Stock Data Dashboard

Production-focused stock intelligence dashboard with:

- Real-time market data APIs (FastAPI backend)
- Responsive React frontend with modern dashboard UX
- Authentication-ready frontend flow with Turnstile integration support
- Improved layout system (Grid/Flex) for desktop, tablet, and mobile

## Why This Project

This project is designed to behave like a practical trading dashboard, not just a demo chart page.  
It combines market metrics, stock comparison, sentiment tools, alerts, and a scalable frontend architecture.

## Tech Stack

- Backend: FastAPI, Python
- Frontend: React
- Data/Analytics: yFinance + custom processing
- Security UX: Cloudflare Turnstile-ready signup flow
- Containerization: Docker Compose support (project-level + service-level)

## Key Features

- Dashboard with stock list + detailed analytics panels
- Top stocks, compare view, watchlist and portfolio scaffolds
- Search-driven stock selection from navigation
- News/sentiment tabs and extensible analytics modules
- Improved responsive layout:
  - Stable navbar alignment
  - Sidebar + content structure with adaptive grid
  - Card spacing and overflow fixes
  - Mobile-friendly behavior without horizontal page scroll

## Recent Production Improvements

- Refactored core page layout to use resilient Grid/Flex patterns
- Fixed UI overflow and alignment issues across breakpoints
- Updated auth API integration flow for backend token-based login
- Added Turnstile-first signup UX behavior and cleaner auth page spacing
- Hardened frontend API error handling for auth paths

## Project Structure

```text
stock-dashboard/
  app/                    # FastAPI backend
  frontend/               # React app
    src/
      components/         # Reusable UI modules
      pages/              # Route-level pages (Login/Signup)
      api.js              # Market data API client
      authAPI.js          # Authentication API client
```

## Local Development

### 1) Backend

```bash
cd app
uvicorn main:app --reload --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000` by default.

## Environment Notes

Use environment variables instead of hardcoding endpoints/secrets:

- `REACT_APP_AUTH_API_BASE` for auth backend base URL
- backend secrets and DB credentials via `.env` or compose env blocks

## Production Readiness Checklist

- Responsive layout validated on desktop/tablet/mobile
- Loading/error states included for async views
- API clients modularized (`api.js`, `authAPI.js`)
- Security checks integrated into signup flow
- Docker support available for deployment workflows

## Roadmap

- Add full Market News Intelligence module with sentiment + impact scoring
- Expand role-based access and hardened auth token lifecycle
- Add integration/e2e tests for auth + dashboard flows

## License

For internal learning and product prototyping. Add an explicit OSS license before public distribution.
