import yfinance as yf
import pandas as pd


def fetch_stock_data(symbol: str) -> pd.DataFrame:
    df = yf.download(symbol, period="1mo", interval="1d")

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

    latest_price = float(df["close"].iloc[-1])
    average_price = float(df["close"].mean())
    max_price = float(df["close"].max())
    min_price = float(df["close"].min())

    volatility = float(df["daily_return"].std())

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
        "volatility": volatility,
        "risk_level": risk,
        "trend": trend
    }