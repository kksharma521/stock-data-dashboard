import yfinance as yf
import pandas as pd
from datetime import datetime
import pytz
import os
import re
import time
import requests
from collections import Counter

# ✅ Market hours (9:30 AM - 4:00 PM EST for US, 9:15 AM - 3:30 PM IST for India)
US_MARKET_OPEN = 9
US_MARKET_CLOSE = 16
INDIA_MARKET_OPEN = 9  # 9:15 AM IST
INDIA_MARKET_CLOSE = 15  # 3:30 PM IST

_stock_cache = {}
_stock_cache_ttl_seconds = 120
_news_cache = {}
_news_cache_ttl_seconds = 300

SENTIMENT_KEYWORDS = {
    "positive": {
        "beat", "growth", "upgrade", "surge", "strong", "profit", "record",
        "outperform", "expands", "bullish", "rally", "optimistic", "wins"
    },
    "negative": {
        "miss", "downgrade", "lawsuit", "probe", "decline", "drop", "weak",
        "loss", "cut", "bearish", "risk", "concern", "layoff", "fraud", "penalty"
    },
    "impact_positive": {
        "earnings beat", "guidance raised", "record revenue", "acquisition",
        "approval", "buyback", "margin expansion"
    },
    "impact_negative": {
        "earnings miss", "guidance cut", "investigation", "class action",
        "recall", "regulatory fine", "downgrade", "bankruptcy"
    },
}


# ✅ Companies list - Extended with popular stocks
def get_companies():
    return [
        # US Stocks (Top 15)
        {"symbol": "AAPL", "name": "Apple Inc.", "market": "US"},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "market": "US"},
        {"symbol": "GOOGL", "name": "Alphabet Inc. (Class A)", "market": "US"},
        {"symbol": "TSLA", "name": "Tesla Inc.", "market": "US"},
        {"symbol": "AMZN", "name": "Amazon.com Inc.", "market": "US"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "market": "US"},
        {"symbol": "META", "name": "Meta Platforms Inc.", "market": "US"},
        {"symbol": "NFLX", "name": "Netflix Inc.", "market": "US"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "market": "US"},
        {"symbol": "JNJ", "name": "Johnson & Johnson", "market": "US"},
        {"symbol": "PG", "name": "Procter & Gamble", "market": "US"},
        {"symbol": "KO", "name": "The Coca-Cola Company", "market": "US"},
        {"symbol": "DIS", "name": "Walt Disney Company", "market": "US"},
        {"symbol": "XOM", "name": "Exxon Mobil Corporation", "market": "US"},
        {"symbol": "INTC", "name": "Intel Corporation", "market": "US"},
    ]


# ✅ Fetch raw data (returns DataFrame ONLY)
def fetch_stock_data(symbol: str):
    symbol = symbol.upper().strip()
    now_ts = time.time()

    cache_entry = _stock_cache.get(symbol)
    if cache_entry and (now_ts - cache_entry["timestamp"] < _stock_cache_ttl_seconds):
        return cache_entry["data"].copy()

    stock = yf.Ticker(symbol)
    df = stock.history(period="1y", auto_adjust=False)

    if df.empty:
        raise ValueError("Invalid symbol or no data found")

    df = df.reset_index()

    df.rename(columns={
        "Date": "date",
        "Open": "open",
        "Close": "close",
        "High": "high",
        "Low": "low"
    }, inplace=True)

    df["date"] = pd.to_datetime(df["date"])

    _stock_cache[symbol] = {"timestamp": now_ts, "data": df.copy()}
    return df  # ✅ FIXED (no list return)


# ✅ Compute all metrics in ONE place
def compute_analysis(df: pd.DataFrame) -> dict:

    # ✅ Daily return
    df["daily_return"] = (df["close"] - df["open"]) / df["open"]

    # ✅ Daily return %
    df["daily_return_pct"] = ((df["close"] - df["close"].shift(1)) / df["close"].shift(1)) * 100
    df["daily_return_pct"] = df["daily_return_pct"].round(2)

    # ✅ 7-day moving average
    df["ma_7"] = df["close"].rolling(window=7).mean().round(2)

    # ✅ Core stats
    latest_price = float(df["close"].iloc[-1])
    average_price = float(df["close"].mean())
    high_52w = float(df["close"].max())
    low_52w = float(df["close"].min())

    # ✅ Distance from high
    distance_from_high = ((latest_price - high_52w) / high_52w) * 100
    distance_from_high = round(distance_from_high, 2)

    # ✅ Volatility
    volatility = float(df["daily_return"].std())
    volatility_pct = round(volatility * 100, 2)
    volatility_score = min(100.0, round(volatility_pct * 6.0, 2))

    # ✅ Risk classification
    if volatility < 0.01:
        risk = "Low"
    elif volatility < 0.03:
        risk = "Medium"
    else:
        risk = "High"

    # ✅ Trend
    trend = "Uptrend" if latest_price > average_price else "Downtrend"

    return {
        "latest_price": latest_price,
        "average_price": average_price,
        "52_week_high": high_52w,
        "52_week_low": low_52w,
        "volatility_pct": volatility_pct,
        "volatility_score": volatility_score,
        "risk_level": risk,
        "trend": trend,
        "distance_from_52w_high_pct": distance_from_high
    }


# ✅ Check if market is open
def is_market_open() -> dict:
    """Check if US and Indian stock markets are open"""
    est = pytz.timezone('US/Eastern')
    ist = pytz.timezone('Asia/Kolkata')

    now_est = datetime.now(est)
    now_ist = datetime.now(ist)

    # US Market Status
    us_status = {}
    if now_est.weekday() >= 5:
        us_status = {
            "is_open": False,
            "status": "US Market Closed - Weekend",
            "current_time": now_est.strftime("%I:%M %p %Z")
        }
    else:
        hour = now_est.hour
        if US_MARKET_OPEN <= hour < US_MARKET_CLOSE:
            us_status = {
                "is_open": True,
                "status": "US Market Open (9:30 AM - 4:00 PM EST)",
                "current_time": now_est.strftime("%I:%M %p %Z")
            }
        elif hour < US_MARKET_OPEN:
            us_status = {
                "is_open": False,
                "status": f"US Pre-Market (Opens at 9:30 AM EST)",
                "current_time": now_est.strftime("%I:%M %p %Z")
            }
        else:
            us_status = {
                "is_open": False,
                "status": "US Market Closed - After Hours",
                "current_time": now_est.strftime("%I:%M %p %Z")
            }

    # Indian Market Status
    india_status = {}
    if now_ist.weekday() >= 5:
        india_status = {
            "is_open": False,
            "status": "Indian Market Closed - Weekend",
            "current_time": now_ist.strftime("%I:%M %p %Z")
        }
    else:
        hour = now_ist.hour
        minute = now_ist.minute

        # Indian market opens at 9:15 AM and closes at 3:30 PM
        market_open_time = INDIA_MARKET_OPEN * 60 + 15  # 9:15 in minutes
        market_close_time = INDIA_MARKET_CLOSE * 60 + 30  # 15:30 in minutes
        current_time_minutes = hour * 60 + minute

        if market_open_time <= current_time_minutes < market_close_time:
            india_status = {
                "is_open": True,
                "status": "Indian Market Open (9:15 AM - 3:30 PM IST)",
                "current_time": now_ist.strftime("%I:%M %p %Z")
            }
        elif current_time_minutes < market_open_time:
            india_status = {
                "is_open": False,
                "status": f"Indian Pre-Market (Opens at 9:15 AM IST)",
                "current_time": now_ist.strftime("%I:%M %p %Z")
            }
        else:
            india_status = {
                "is_open": False,
                "status": "Indian Market Closed - After Hours",
                "current_time": now_ist.strftime("%I:%M %p %Z")
            }

    return {
        "us_market": us_status,
        "india_market": india_status,
        "timestamp": datetime.now().isoformat()
    }


def _default_news(symbol: str) -> list:
    return [
        {
            "title": f"{symbol} reports quarterly update with stable outlook",
            "content": f"{symbol} management highlighted disciplined execution and reiterated guidance.",
            "source": "Market Desk",
            "published_at": datetime.utcnow().isoformat() + "Z",
            "url": "",
            "symbol": symbol,
        },
        {
            "title": f"Analysts review {symbol} valuation after recent move",
            "content": f"Broker commentary remains mixed on {symbol} as macro conditions evolve.",
            "source": "Street Journal",
            "published_at": datetime.utcnow().isoformat() + "Z",
            "url": "",
            "symbol": symbol,
        },
    ]


def _fetch_finnhub_news(symbol: str, from_date: str, to_date: str) -> list:
    api_key = os.getenv("FINNHUB_API_KEY", "").strip()
    if not api_key:
        return []

    response = requests.get(
        "https://finnhub.io/api/v1/company-news",
        params={
            "symbol": symbol,
            "from": from_date,
            "to": to_date,
            "token": api_key,
        },
        timeout=6,
    )
    response.raise_for_status()
    rows = response.json() or []

    normalized = []
    for row in rows[:30]:
        ts = row.get("datetime")
        published_at = datetime.utcfromtimestamp(ts).isoformat() + "Z" if ts else datetime.utcnow().isoformat() + "Z"
        normalized.append(
            {
                "title": row.get("headline", "").strip(),
                "content": row.get("summary", "").strip(),
                "source": row.get("source", "Finnhub"),
                "published_at": published_at,
                "url": row.get("url", ""),
                "symbol": symbol,
            }
        )
    return [item for item in normalized if item["title"]]


def _extract_keywords(text: str, max_keywords: int = 5) -> list:
    tokens = re.findall(r"[A-Za-z]{4,}", text.lower())
    stop_words = {
        "this", "that", "with", "from", "into", "after", "before", "their", "about",
        "stock", "shares", "market", "today", "company", "analysts", "reports",
    }
    filtered = [token for token in tokens if token not in stop_words]
    return [word for word, _ in Counter(filtered).most_common(max_keywords)]


def _summarize_text(title: str, content: str) -> str:
    if not content:
        return title
    compact = re.sub(r"\s+", " ", content).strip()
    if len(compact) <= 170:
        return compact
    return compact[:167].rstrip() + "..."


def _sentiment_score(text: str) -> float:
    text_l = text.lower()
    pos_hits = sum(1 for w in SENTIMENT_KEYWORDS["positive"] if w in text_l)
    neg_hits = sum(1 for w in SENTIMENT_KEYWORDS["negative"] if w in text_l)
    raw = (pos_hits - neg_hits) / max(1, pos_hits + neg_hits)
    return max(-1.0, min(1.0, round(raw, 2)))


def _sentiment_label(score: float) -> str:
    if score >= 0.2:
        return "positive"
    if score <= -0.2:
        return "negative"
    return "neutral"


def _impact_label(score: float, text: str) -> str:
    text_l = text.lower()
    if any(key in text_l for key in SENTIMENT_KEYWORDS["impact_positive"]) or score >= 0.45:
        return "bullish"
    if any(key in text_l for key in SENTIMENT_KEYWORDS["impact_negative"]) or score <= -0.45:
        return "bearish"
    return "neutral"


def _confidence_level(score: float, text: str) -> str:
    keyword_count = len(_extract_keywords(text))
    weighted = abs(score) * 100 + (keyword_count * 6)
    if weighted >= 70:
        return "high"
    if weighted >= 45:
        return "medium"
    return "low"


def get_stock_news(symbol: str) -> list:
    """Get normalized news for a stock with API fallback and in-memory caching."""
    symbol = symbol.upper().strip()
    now_ts = time.time()
    cache_entry = _news_cache.get(symbol)
    if cache_entry and (now_ts - cache_entry["timestamp"] < _news_cache_ttl_seconds):
        return cache_entry["data"]

    to_date = datetime.utcnow().date().isoformat()
    from_date = (datetime.utcnow().date() - pd.Timedelta(days=7)).isoformat()

    try:
        news = _fetch_finnhub_news(symbol, from_date, to_date)
    except Exception:
        news = []

    if not news:
        news = _default_news(symbol)

    _news_cache[symbol] = {"timestamp": now_ts, "data": news}
    return news


def build_news_intelligence(symbol: str) -> list:
    """Transform raw news into actionable intelligence records."""
    items = get_stock_news(symbol)
    enriched = []
    for item in items:
        text = f"{item.get('title', '')}. {item.get('content', '')}".strip()
        score = _sentiment_score(text)
        sentiment = _sentiment_label(score)
        impact = _impact_label(score, text)
        confidence = _confidence_level(score, text)
        enriched.append(
            {
                "title": item.get("title", ""),
                "source": item.get("source", "Unknown"),
                "published_at": item.get("published_at"),
                "url": item.get("url", ""),
                "symbol": item.get("symbol", symbol.upper()),
                "summary": _summarize_text(item.get("title", ""), item.get("content", "")),
                "keywords": _extract_keywords(text, max_keywords=5),
                "sentiment": {
                    "label": sentiment,
                    "score": score,
                },
                "impact": impact,
                "high_impact": impact != "neutral" and abs(score) >= 0.45,
                "confidence": confidence,
            }
        )
    return enriched


def get_market_news_intelligence(symbol: str | None = None, sentiment: str | None = None, limit: int = 30) -> dict:
    symbols = [symbol.upper().strip()] if symbol else [c["symbol"] for c in get_companies()[:8]]
    all_items = []
    for sym in symbols:
        all_items.extend(build_news_intelligence(sym))

    if sentiment:
        sentiment = sentiment.lower()
        all_items = [item for item in all_items if item["sentiment"]["label"] == sentiment]

    all_items = sorted(all_items, key=lambda x: x.get("published_at", ""), reverse=True)[:limit]
    if not all_items:
        return {
            "items": [],
            "summary": {"label": "neutral", "positive_pct": 0, "message": "No relevant news available right now."},
            "trending_stocks": [],
            "high_impact_news": [],
        }

    pos_count = sum(1 for item in all_items if item["sentiment"]["label"] == "positive")
    neg_count = sum(1 for item in all_items if item["sentiment"]["label"] == "negative")
    total = len(all_items)
    positive_pct = round((pos_count / total) * 100, 1)

    market_label = "bullish" if pos_count > neg_count else "bearish" if neg_count > pos_count else "neutral"
    summary_msg = f"Today's market sentiment is {market_label.title()} ({positive_pct}% positive)."

    ticker_counter = Counter(item["symbol"] for item in all_items)
    trending = [{"symbol": ticker, "news_count": count} for ticker, count in ticker_counter.most_common(5)]

    high_impact = [item for item in all_items if item["high_impact"]][:6]
    return {
        "items": all_items,
        "summary": {
            "label": market_label,
            "positive_pct": positive_pct,
            "message": summary_msg,
        },
        "trending_stocks": trending,
        "high_impact_news": high_impact,
    }


# ✅ Get alerts for stock
def get_stock_alerts(symbol: str, analysis: dict) -> list:
    """Generate alerts based on stock analysis"""
    alerts = []
    
    # Price alerts
    if analysis.get("distance_from_52w_high_pct") < -20:
        alerts.append({
            "type": "warning",
            "title": "Price at Significant Low",
            "message": f"Stock trading {abs(analysis['distance_from_52w_high_pct']):.1f}% below 52-week high"
        })
    
    if analysis.get("distance_from_52w_high_pct") > -5:
        alerts.append({
            "type": "success",
            "title": "Price Near All-Time High",
            "message": "Stock near 52-week high - Strong performance"
        })
    
    # Volatility alerts
    if analysis.get("risk_level") == "High":
        alerts.append({
            "type": "alert",
            "title": "High Volatility",
            "message": f"Volatility: {analysis['volatility_pct']:.2f}% - Higher risk"
        })
    elif analysis.get("risk_level") == "Low":
        alerts.append({
            "type": "info",
            "title": "Stable Stock",
            "message": f"Low volatility: {analysis['volatility_pct']:.2f}% - Good for long-term"
        })
    
    # Trend alerts
    if analysis.get("trend") == "Uptrend":
        alerts.append({
            "type": "success",
            "title": "Uptrend Signal",
            "message": "Stock trading above average - Positive momentum"
        })
    else:
        alerts.append({
            "type": "warning",
            "title": "Downtrend Signal",
            "message": "Stock trading below average - Negative momentum"
        })
    
    return alerts


# ✅ Get top 10 earning stocks (highest % gainers today)
def get_top_earners():
    """Get top 10 stocks with highest percentage gains today"""
    companies = get_companies()
    top_earners = []

    for company in companies:
        try:
            # Get recent data (last 5 days to ensure we have data)
            stock = yf.Ticker(company["symbol"])
            df = stock.history(period="5d")

            if not df.empty and len(df) >= 2:
                # Calculate today's percentage change
                latest_close = df["Close"].iloc[-1]
                previous_close = df["Close"].iloc[-2]
                pct_change = ((latest_close - previous_close) / previous_close) * 100

                top_earners.append({
                    "symbol": company["symbol"],
                    "name": company["name"],
                    "market": company.get("market", "US"),
                    "price": round(float(latest_close), 2),
                    "change_pct": round(float(pct_change), 2),
                    "change": round(float(latest_close - previous_close), 2)
                })
        except Exception as e:
            print(f"Error fetching data for {company['symbol']}: {e}")
            continue

    # Sort by percentage change descending and take top 10
    top_earners.sort(key=lambda x: x["change_pct"], reverse=True)
    return top_earners[:10]


def get_top_losers():
    """Get top 10 stocks with largest percentage declines today."""
    companies = get_companies()
    losers = []
    for company in companies:
        try:
            stock = yf.Ticker(company["symbol"])
            df = stock.history(period="5d")
            if not df.empty and len(df) >= 2:
                latest_close = df["Close"].iloc[-1]
                previous_close = df["Close"].iloc[-2]
                pct_change = ((latest_close - previous_close) / previous_close) * 100
                losers.append(
                    {
                        "symbol": company["symbol"],
                        "name": company["name"],
                        "market": company.get("market", "US"),
                        "price": round(float(latest_close), 2),
                        "change_pct": round(float(pct_change), 2),
                        "change": round(float(latest_close - previous_close), 2),
                    }
                )
        except Exception:
            continue

    losers.sort(key=lambda x: x["change_pct"])
    return losers[:10]


# ✅ Get top 10 long-term investment stocks
def get_top_long_term():
    """Get top 10 stocks suitable for long-term investment based on stability and growth"""
    companies = get_companies()
    long_term_candidates = []

    for company in companies:
        try:
            # Get 1 year data for analysis
            stock = yf.Ticker(company["symbol"])
            df = stock.history(period="1y")

            if not df.empty and len(df) >= 200:  # At least 200 trading days
                # Calculate metrics for long-term investment
                returns = df["Close"].pct_change().dropna()

                # Annual return
                total_return = (df["Close"].iloc[-1] / df["Close"].iloc[0] - 1) * 100

                # Volatility (annualized)
                volatility = returns.std() * (252 ** 0.5) * 100  # 252 trading days

                # Sharpe ratio approximation (assuming 2% risk-free rate)
                sharpe_ratio = (total_return - 2) / volatility if volatility > 0 else 0

                # Maximum drawdown
                cumulative = (1 + returns).cumprod()
                running_max = cumulative.expanding().max()
                drawdown = (cumulative - running_max) / running_max
                max_drawdown = drawdown.min() * 100

                # Score based on low volatility, positive returns, low drawdown
                score = (total_return * 0.4) + (sharpe_ratio * 0.3) + (abs(max_drawdown) * -0.3)

                long_term_candidates.append({
                    "symbol": company["symbol"],
                    "name": company["name"],
                    "market": company.get("market", "US"),
                    "price": round(float(df["Close"].iloc[-1]), 2),
                    "annual_return": round(float(total_return), 2),
                    "volatility": round(float(volatility), 2),
                    "sharpe_ratio": round(float(sharpe_ratio), 2),
                    "max_drawdown": round(float(max_drawdown), 2),
                    "score": round(float(score), 2)
                })
        except Exception as e:
            print(f"Error analyzing {company['symbol']}: {e}")
            continue

    # Sort by score descending and take top 10
    long_term_candidates.sort(key=lambda x: x["score"], reverse=True)
    return long_term_candidates[:10]


# ✅ Get top 10 best stocks of the day (based on volume and price action)
def get_top_daily_stocks():
    """Get top 10 stocks with best performance today based on volume and price action"""
    companies = get_companies()
    daily_top = []

    for company in companies:
        try:
            # Get recent data
            stock = yf.Ticker(company["symbol"])
            df = stock.history(period="5d")

            if not df.empty and len(df) >= 2:
                # Today's data
                latest_close = df["Close"].iloc[-1]
                latest_volume = df["Volume"].iloc[-1]
                previous_close = df["Close"].iloc[-2]

                # Calculate metrics
                pct_change = ((latest_close - previous_close) / previous_close) * 100

                # Average volume over last 5 days
                avg_volume = df["Volume"].tail(5).mean()

                # Volume ratio (today's volume vs average)
                volume_ratio = latest_volume / avg_volume if avg_volume > 0 else 1

                # Price action score (combines % change and volume)
                price_score = pct_change * (1 + volume_ratio * 0.1)

                daily_top.append({
                    "symbol": company["symbol"],
                    "name": company["name"],
                    "market": company.get("market", "US"),
                    "price": round(float(latest_close), 2),
                    "change_pct": round(float(pct_change), 2),
                    "volume": int(latest_volume),
                    "volume_ratio": round(float(volume_ratio), 2),
                    "score": round(float(price_score), 2)
                })
        except Exception as e:
            print(f"Error fetching data for {company['symbol']}: {e}")
            continue

    # Sort by score descending and take top 10
    daily_top.sort(key=lambda x: x["score"], reverse=True)
    return daily_top[:10]
