import pandas as pd


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