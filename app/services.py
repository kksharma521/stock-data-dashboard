import yfinance as yf
import pandas as pd


def fetch_stock_data(symbol: str) -> pd.DataFrame:
    df = yf.download(symbol, period="1y", interval="1d")
    if df is None or df.empty:
        raise ValueError("No data found for symbol")

    df = df.reset_index()

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [col[0] for col in df.columns]

    df = df.rename(columns={
        "Date": "date",
        "Open": "open",
        "Close": "close"
    })

    df = df[["date", "open", "close"]]

    df["date"] = df["date"].astype(str)
    df["open"] = pd.to_numeric(df["open"], errors="coerce")
    df["close"] = pd.to_numeric(df["close"], errors="coerce")

    df = df.dropna()

    return df


def compute_analysis(df: pd.DataFrame) -> dict:
    df["daily_return"] = (df["close"] - df["open"]) / df["open"]

    # daily return %
    df["daily_return_pct"] = ((df["close"] - df["close"].shift(1)) / df["close"].shift(1)) * 100
    df["daily_return_pct"] = df["daily_return_pct"].round(2)

    # moving average
    df["ma_7"] = df["close"].rolling(window=7).mean()
    df["ma_7"] = df["ma_7"].round(2)

    latest_price = float(df["close"].iloc[-1])
    average_price = float(df["close"].mean())
    high_52w = float(df["close"].max())
    low_52w = float(df["close"].min())

    max_price = high_52w
    min_price = low_52w

    # calculate FIRST, then round
    distance_from_high = ((latest_price - high_52w) / high_52w) * 100
    distance_from_high = round(distance_from_high, 2)

    volatility = float(df["daily_return"].std())
    volatility_pct = round(volatility * 100, 2)

    if volatility < 0.01:
        risk = "Low"
    elif volatility < 0.03:
        risk = "Medium"
    else:
        risk = "High"

    trend = "Uptrend" if latest_price > average_price else "Downtrend"

    return {
        "latest_price": latest_price,
        "average_price": average_price,
        "max_price": max_price,
        "min_price": min_price,
        "volatility_pct": volatility_pct,
        "risk_level": risk,
        "trend": trend,
        "52_week_high": high_52w,
        "52_week_low": low_52w,
        "distance_from_52w_high_pct": distance_from_high
    }