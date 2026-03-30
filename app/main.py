from fastapi import FastAPI, HTTPException, Query
from app.services import fetch_stock_data, compute_analysis

app = FastAPI()


def generate_insight(r1, r2, better):
    diff = abs(r1 - r2)

    if diff < 0.02:
        return "Both stocks performed similarly"
    elif better == "Equal":
        return "Both stocks have equal performance"
    else:
        return f"{better} significantly outperformed the other stock"


@app.get("/compare")
def compare_stocks(
    symbol1: str = Query(...),
    symbol2: str = Query(...)
):
    try:
        df1 = fetch_stock_data(symbol1)
        df2 = fetch_stock_data(symbol2)

        analysis1 = compute_analysis(df1)
        analysis2 = compute_analysis(df2)

        return1 = (df1["close"].iloc[-1] - df1["close"].iloc[0]) / df1["close"].iloc[0]
        return2 = (df2["close"].iloc[-1] - df2["close"].iloc[0]) / df2["close"].iloc[0]

        return1_pct = return1 * 100
        return2_pct = return2 * 100

        if return1 > return2:
            better = symbol1.upper()
        elif return2 > return1:
            better = symbol2.upper()
        else:
            better = "Equal"

        if analysis1["volatility"] > analysis2["volatility"]:
            more_volatile = symbol1.upper()
        elif analysis2["volatility"] > analysis1["volatility"]:
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
def get_stock(symbol: str):
    try:
        df = fetch_stock_data(symbol)
        analysis = compute_analysis(df)

        data = df[["date", "close"]].to_dict(orient="records")

        return {
            "symbol": symbol.upper(),
            "data": data,
            "analysis": analysis
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))