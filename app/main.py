from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Query, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from pydantic import BaseModel, EmailStr
import os
import requests
import pandas as pd
from services import (
    fetch_stock_data,
    compute_analysis,
    get_companies,
    is_market_open,
    get_stock_news,
    get_stock_alerts,
    get_top_earners,
    get_top_losers,
    get_top_long_term,
    get_top_daily_stocks,
    build_news_intelligence,
    get_market_news_intelligence,
)
from database import SessionLocal, get_db, User, UserStock
from auth import (
    get_password_hash, verify_password, create_access_token, create_refresh_token,
    verify_token, validate_password, validate_email, check_rate_limit,
    generate_stock_captcha, verify_stock_captcha, generate_totp_secret,
    generate_totp_code, verify_totp_code, hash_sensitive_data, sanitize_input
)
# from sentiment_analyzer import initialize_sentiment_model, get_stock_sentiment, get_market_sentiment
import json
import uuid
from datetime import datetime, timedelta

app = FastAPI(title="Stock Dashboard API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ✅ Advanced Pydantic Models
class SignupRequest(BaseModel):
    email: str
    username: str
    password: str
    confirm_password: str
    full_name: str
    captcha_answer: Optional[str] = None
    captcha_id: Optional[str] = None
    enable_2fa: bool = False
    turnstile_token: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    totp_code: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserProfile(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    watchlist: list
    theme: str
    notifications: bool
    created_at: str
    two_factor_enabled: bool = False

class WatchlistRequest(BaseModel):
    symbol: str
    action: str  # "add" or "remove"

class TwoFactorSetup(BaseModel):
    enable: bool
    totp_code: Optional[str] = None


TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA"
TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA"


def verify_turnstile_token(token: Optional[str], remote_ip: Optional[str] = None) -> bool:
    """Verify Cloudflare Turnstile token server-side."""
    if not token:
        return False

    secret_key = os.getenv("TURNSTILE_SECRET_KEY", TURNSTILE_TEST_SECRET)
    payload = {
        "secret": secret_key,
        "response": token,
    }
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        response = requests.post(TURNSTILE_VERIFY_URL, data=payload, timeout=5)
        response.raise_for_status()
        result = response.json()
        return bool(result.get("success"))
    except Exception:
        return False

# ✅ Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    client_ip = request.client.host if request.client else "unknown"

    # Different limits for different endpoints
    if request.url.path.startswith("/auth/"):
        if not check_rate_limit(f"auth_{client_ip}", max_requests=5, window_seconds=300):
            raise HTTPException(
                status_code=429,
                detail="Too many authentication attempts. Please try again later."
            )
    elif request.url.path.startswith("/api/"):
        if not check_rate_limit(f"api_{client_ip}", max_requests=100, window_seconds=60):
            raise HTTPException(
                status_code=429,
                detail="API rate limit exceeded. Please try again later."
            )

    response = await call_next(request)
    return response

# ✅ Stock Market CAPTCHA endpoint
@app.get("/auth/captcha")
def get_stock_captcha():
    """Generate stock market oriented CAPTCHA"""
    captcha_data = generate_stock_captcha()

    # Store CAPTCHA in app state (in production, use Redis/database)
    captcha_id = str(uuid.uuid4())
    if not hasattr(app.state, 'captcha_store'):
        app.state.captcha_store = {}

    app.state.captcha_store[captcha_id] = {
        "answer": captcha_data["answer"],
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }

    return {
        "captcha_id": captcha_id,
        "question": captcha_data["question"],
        "message": "Solve this stock market puzzle"
    }


@app.get("/auth/turnstile/sitekey")
def get_turnstile_site_key():
    """Return Turnstile site key for frontend widget rendering."""
    return {"site_key": os.getenv("TURNSTILE_SITE_KEY", TURNSTILE_TEST_SITE_KEY)}

# ✅ Enhanced signup endpoint with 2FA support
@app.post("/auth/signup")
def signup(signup_data: SignupRequest, req: Request, db=Depends(get_db)):
    """Register a new user with advanced security"""
    # Rate limiting check
    if not check_rate_limit(f"signup_{signup_data.email}", max_requests=3, window_seconds=3600):
        raise HTTPException(
            status_code=429,
            detail="Too many signup attempts. Please try again later."
        )

    # Sanitize inputs
    signup_data.email = sanitize_input(signup_data.email, 254)
    signup_data.username = sanitize_input(signup_data.username, 50)
    signup_data.full_name = sanitize_input(signup_data.full_name, 100)

    # Verify Cloudflare Turnstile
    remote_ip = req.client.host if req.client else None
    if not verify_turnstile_token(signup_data.turnstile_token, remote_ip):
        raise HTTPException(status_code=400, detail="Turnstile verification failed")

    # Validate email
    if not validate_email(signup_data.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Validate password strength
    pwd_validation = validate_password(signup_data.password)
    if not pwd_validation["valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Password too weak: {', '.join(pwd_validation['issues'])}"
        )

    # Check if passwords match
    if signup_data.password != signup_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # Verify server CAPTCHA only when provided (legacy flow).
    if signup_data.captcha_id and signup_data.captcha_answer:
        if not hasattr(app.state, 'captcha_store') or signup_data.captcha_id not in app.state.captcha_store:
            raise HTTPException(status_code=400, detail="Invalid CAPTCHA session")

        captcha_data = app.state.captcha_store[signup_data.captcha_id]
        if datetime.utcnow() > captcha_data["expires"]:
            del app.state.captcha_store[signup_data.captcha_id]
            raise HTTPException(status_code=400, detail="CAPTCHA expired")

        if not verify_stock_captcha(signup_data.captcha_answer, captcha_data["answer"]):
            del app.state.captcha_store[signup_data.captcha_id]
            raise HTTPException(status_code=400, detail="Incorrect CAPTCHA answer")

        # Remove used CAPTCHA
        del app.state.captcha_store[signup_data.captcha_id]

    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == signup_data.email) | (User.username == signup_data.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    # Create new user
    hashed_password = get_password_hash(signup_data.password)
    totp_secret = generate_totp_secret() if signup_data.enable_2fa else None

    new_user = User(
        email=signup_data.email,
        username=signup_data.username,
        hashed_password=hashed_password,
        full_name=signup_data.full_name
    )

    # Add 2FA secret if enabled (store securely in production)
    if totp_secret:
        new_user.two_factor_secret = totp_secret
        new_user.two_factor_enabled = True

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create tokens
    access_token = create_access_token(data={"sub": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.email})

    response_data = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username,
            "full_name": new_user.full_name,
            "two_factor_enabled": bool(totp_secret)
        }
    }

    if totp_secret:
        response_data["totp_secret"] = totp_secret
        response_data["message"] = "Account created! Set up 2FA with the provided secret."

    return response_data

# ✅ Enhanced login endpoint with 2FA support
@app.post("/auth/login")
def login(request: LoginRequest, db = Depends(get_db)):
    """Login user with advanced security"""
    # Rate limiting
    if not check_rate_limit(f"login_{request.email}", max_requests=5, window_seconds=900):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again later."
        )

    # Sanitize input
    request.email = sanitize_input(request.email, 254)

    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        # Log failed attempt (hash sensitive data)
        print(f"Failed login attempt for: {hash_sensitive_data(request.email)}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")

    # Check 2FA if enabled
    if user.two_factor_enabled:
        if not request.totp_code:
            return {
                "requires_2fa": True,
                "message": "Two-factor authentication required",
                "user_id": user.id
            }

        if not verify_totp_code(user.two_factor_secret, request.totp_code):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")

    # Create tokens
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "two_factor_enabled": user.two_factor_enabled
        }
    }

# ✅ Token refresh endpoint
@app.post("/auth/refresh")
def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    payload = verify_token(request.refresh_token, "refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Create new access token
    access_token = create_access_token(data={"sub": payload.get("sub")})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# ✅ 2FA setup endpoint
@app.post("/auth/2fa/setup")
def setup_2fa(request: TwoFactorSetup, credentials: HTTPAuthorizationCredentials = Depends(security), db = Depends(get_db)):
    """Enable or disable 2FA"""
    token_payload = verify_token(credentials.credentials)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == token_payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.enable:
        # Generate new TOTP secret
        totp_secret = generate_totp_secret()

        if not request.totp_code:
            # Return secret for setup (don't enable yet)
            return {
                "totp_secret": totp_secret,
                "message": "Use this secret to set up 2FA in your authenticator app, then provide a code to enable"
            }

        # Verify the code and enable 2FA
        if not verify_totp_code(totp_secret, request.totp_code):
            raise HTTPException(status_code=400, detail="Invalid TOTP code")

        user.two_factor_secret = totp_secret
        user.two_factor_enabled = True
        message = "Two-factor authentication enabled"
    else:
        # Disable 2FA
        user.two_factor_enabled = False
        user.two_factor_secret = None
        message = "Two-factor authentication disabled"

    db.commit()

    return {"message": message, "two_factor_enabled": user.two_factor_enabled}

# ✅ Enhanced get user profile
@app.get("/auth/profile")
def get_profile(credentials: HTTPAuthorizationCredentials = Depends(security), db = Depends(get_db)):
    """Get current user profile with security info"""
    token_payload = verify_token(credentials.credentials)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == token_payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    watchlist = json.loads(user.watchlist) if user.watchlist else []

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "watchlist": watchlist,
        "theme": user.theme,
        "notifications": user.notifications,
        "created_at": user.created_at.isoformat(),
        "two_factor_enabled": user.two_factor_enabled
    }

# ✅ Add to watchlist
@app.post("/auth/watchlist/add")
def add_to_watchlist(request: WatchlistRequest, credentials: HTTPAuthorizationCredentials = Depends(security), db = Depends(get_db)):
    """Add stock to watchlist"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    watchlist = json.loads(user.watchlist) if user.watchlist else []
    
    if request.symbol not in watchlist:
        watchlist.append(request.symbol)
    
    user.watchlist = json.dumps(watchlist)
    db.commit()
    
    return {"watchlist": watchlist, "message": f"{request.symbol} added to watchlist"}

# ✅ Remove from watchlist
@app.post("/auth/watchlist/remove")
def remove_from_watchlist(request: WatchlistRequest, credentials: HTTPAuthorizationCredentials = Depends(security), db = Depends(get_db)):
    """Remove stock from watchlist"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    watchlist = json.loads(user.watchlist) if user.watchlist else []
    
    if request.symbol in watchlist:
        watchlist.remove(request.symbol)
    
    user.watchlist = json.dumps(watchlist)
    db.commit()
    
    return {"watchlist": watchlist, "message": f"{request.symbol} removed from watchlist"}

# ✅ Companies endpoint
@app.get("/companies")
def companies():
    return {
        "companies": get_companies()
    }


# ✅ Insight generator (clean logic)
def generate_insight(r1, r2, better):
    diff = abs(r1 - r2)

    if diff < 0.02:
        return "Both stocks performed similarly"
    elif better == "Equal":
        return "Both stocks have equal performance"
    else:
        return f"{better} significantly outperformed the other stock"


# ✅ Compare endpoint
@app.get("/compare")
def compare_stocks(symbol1: str = Query(...), symbol2: str = Query(...)):

    if symbol1.upper() == symbol2.upper():
        return {
            "symbol1": symbol1.upper(),
            "symbol2": symbol2.upper(),
            "comparison": {
                "return_symbol1": 0,
                "return_symbol2": 0,
                "better_performer": "Equal",
                "more_volatile": "Equal",
                "insight": "Both symbols are the same"
            }
        }

    try:
        df1 = fetch_stock_data(symbol1)
        df2 = fetch_stock_data(symbol2)

        analysis1 = compute_analysis(df1)
        analysis2 = compute_analysis(df2)

        return1 = (df1["close"].iloc[-1] - df1["close"].iloc[0]) / df1["close"].iloc[0]
        return2 = (df2["close"].iloc[-1] - df2["close"].iloc[0]) / df2["close"].iloc[0]

        return1_pct = round(return1 * 100, 2)
        return2_pct = round(return2 * 100, 2)

        # ✅ Better performer
        if return1 > return2:
            better = symbol1.upper()
        elif return2 > return1:
            better = symbol2.upper()
        else:
            better = "Equal"

        # ✅ Volatility compare
        if analysis1["volatility_pct"] > analysis2["volatility_pct"]:
            more_volatile = symbol1.upper()
        elif analysis2["volatility_pct"] > analysis1["volatility_pct"]:
            more_volatile = symbol2.upper()
        else:
            more_volatile = "Equal"

        insight = generate_insight(return1, return2, better)

        return {
            "symbol1": symbol1.upper(),
            "symbol2": symbol2.upper(),
            "comparison": {
                "return_symbol1": float(return1_pct),
                "return_symbol2": float(return2_pct),
                "better_performer": better,
                "more_volatile": more_volatile,
                "insight": insight
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/data/{symbol}")
def get_stock(symbol: str, period: int = 30):
    try:
        df = fetch_stock_data(symbol)
        analysis = compute_analysis(df)

        df_last = df.sort_values("date").tail(period).copy()
        df_last["date"] = df_last["date"].astype(str)

        columns = ["date", "open", "close", "high", "low", "ma_7", "daily_return_pct"]

        data = df_last[columns].to_dict(orient="records")

        return {
            "symbol": symbol.upper(),
            "data": data,
            "analysis": analysis
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ✅ Summary endpoint (required by assignment)
@app.get("/summary/{symbol}")
def summary(symbol: str):
    try:
        df = fetch_stock_data(symbol)
        df["daily_return_pct"] = ((df["close"] - df["close"].shift(1)) / df["close"].shift(1)) * 100
        df["ma_7"] = df["close"].rolling(window=7).mean()
        analysis = compute_analysis(df)

        high_52 = df["close"].max()
        low_52 = df["close"].min()
        avg_close = df["close"].mean()
        latest_return = df["daily_return_pct"].iloc[-1]
        latest_ma7 = df["ma_7"].iloc[-1]

        return {
            "symbol": symbol.upper(),
            "52_week_high": round(float(high_52), 2),
            "52_week_low": round(float(low_52), 2),
            "average_close": round(float(avg_close), 2),
            "latest_daily_return_pct": round(float(latest_return), 2),
            "latest_ma_7": round(float(latest_ma7), 2) if pd.notna(latest_ma7) else None,
            "volatility_score": analysis.get("volatility_score", 0),
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ✅ Market status endpoint
@app.get("/market/status")
def market_status():
    return is_market_open()


# ✅ Stock news endpoint
@app.get("/news/{symbol}")
def stock_news(symbol: str):
    try:
        news = build_news_intelligence(symbol.upper())
        return {
            "symbol": symbol.upper(),
            "news": news
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/news/intelligence")
def market_news_intelligence(
    symbol: Optional[str] = Query(default=None),
    sentiment: Optional[str] = Query(default=None),
    limit: int = Query(default=30, ge=1, le=100),
):
    try:
        return get_market_news_intelligence(symbol=symbol, sentiment=sentiment, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ Stock alerts endpoint
@app.get("/alerts/{symbol}")
def stock_alerts(symbol: str, period: int = 30):
    try:
        df = fetch_stock_data(symbol)
        analysis = compute_analysis(df)
        alerts = get_stock_alerts(symbol.upper(), analysis)
        
        return {
            "symbol": symbol.upper(),
            "alerts": alerts,
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# ✅ Top 10 earning stocks endpoint
@app.get("/top/earners")
def top_earners():
    try:
        earners = get_top_earners()
        return {
            "top_earners": earners,
            "count": len(earners),
            "description": "Top 10 stocks with highest percentage gains today"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch top earners: {str(e)}")


@app.get("/top/losers")
def top_losers():
    try:
        losers = get_top_losers()
        return {
            "top_losers": losers,
            "count": len(losers),
            "description": "Top 10 stocks with largest percentage declines today",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch top losers: {str(e)}")


# ✅ Top 10 long-term investment stocks endpoint
@app.get("/top/long-term")
def top_long_term():
    try:
        long_term = get_top_long_term()
        return {
            "top_long_term": long_term,
            "count": len(long_term),
            "description": "Top 10 stocks suitable for long-term investment based on stability and growth metrics"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch long-term stocks: {str(e)}")


# ✅ Top 10 best stocks of the day endpoint
@app.get("/top/daily")
def top_daily_stocks():
    try:
        daily_top = get_top_daily_stocks()
        return {
            "top_daily": daily_top,
            "count": len(daily_top),
            "description": "Top 10 stocks with best performance today based on price action and volume"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch daily top stocks: {str(e)}")


# ✅ Sentiment Analysis Endpoints

# ✅ Stock sentiment analysis endpoint
# @app.get("/sentiment/stock/{symbol}")
# def stock_sentiment(symbol: str):
#     """Get sentiment analysis for a specific stock using LSTM model"""
#     try:
#         sentiment_data = get_stock_sentiment(symbol.upper())
#         return {
#             "symbol": symbol.upper(),
#             "sentiment_analysis": sentiment_data,
#             "status": "success"
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")


# ✅ Market sentiment analysis endpoint
# @app.get("/sentiment/market")
# def market_sentiment():
#     """Get overall market sentiment analysis using LSTM model"""
#     try:
#         market_data = get_market_sentiment()
#         return {
#             "market_sentiment": market_data,
#             "status": "success"
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Market sentiment analysis failed: {str(e)}")


# ✅ Initialize sentiment model on startup
# @app.on_event("startup")
# async def startup_event():
#     """Initialize the sentiment analysis model on application startup"""
#     try:
#         initialize_sentiment_model()
#         print("Sentiment analysis model initialized successfully")
#     except Exception as e:
#         print(f"Failed to initialize sentiment model: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
