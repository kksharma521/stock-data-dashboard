# Quick Testing Guide

## Current System Status

✅ Backend running on: http://localhost:8000  
✅ Frontend running on: http://localhost:3000

## 1. Test Top Stocks Features in Browser

### Open the Dashboard
Navigate to: **http://localhost:3000**

### A. View Top 10 Earning Stocks
1. Click **"Top Stocks"** tab in navigation
2. Click **"Top Earners"** tab
3. See stocks ranked by highest daily % gains
4. Markets: Both US and Indian stocks (marked in Market column)

### B. View Long-Term Investment Stocks  
1. Click **"Top Stocks"** tab
2. Click **"Long-Term"** tab
3. See stocks ranked by investment quality metric
4. Shows: Annual Return, Volatility, Sharpe Ratio, Max Drawdown, Score

### C. View Best Stocks of the Day
1. Click **"Top Stocks"** tab
2. Click **"Best of Day"** tab
3. See stocks ranked by combined price action + volume performance
4. Shows: % Change, Volume, Volume Ratio, Score

## 2. Test Profile Menu

### Access Profile
1. Look for **👤 Username** button in top-right corner
2. Click it to open dropdown menu
3. See:
   - Your full name
   - Your email
   - Quick action buttons: My Panel, Settings, Logout

### Close Menu
- Click anywhere outside the menu to close
- Or click an option to navigate

## 3. Test Market Status

### Find Market Status
1. View in **StockDetail** component (bottom of stock chart)
2. See two status cards:
   - **US Market:** Shows EST timezone and 9:30 AM - 4:00 PM hours
   - **Indian Market:** Shows IST timezone and 9:15 AM - 3:30 PM hours

### Status Indicators
- 🟢 = Market Open (trading happening right now)
- 🔴 = Market Closed (pre-market, after hours, or weekend)

## 4. Test Backend APIs Directly

### Using PowerShell

```powershell
# Test Top Earners
$response = Invoke-WebRequest -Uri "http://localhost:8000/top/earners"
$response.Content | ConvertFrom-Json | Format-Wide

# Test Long-Term Stocks
$response = Invoke-WebRequest -Uri "http://localhost:8000/top/long-term"
$response.Content | ConvertFrom-Json | Format-Wide

# Test Daily Top Stocks
$response = Invoke-WebRequest -Uri "http://localhost:8000/top/daily"
$response.Content | ConvertFrom-Json | Format-Wide

# Test Market Status (Dual Markets)
$response = Invoke-WebRequest -Uri "http://localhost:8000/market/status"
$response.Content | ConvertFrom-Json | Format-Wide
```

## 5. Test Indian Stock Symbols

Try searching for these Indian stocks in the dashboard:

### NSE Stocks Include:
- **RELIANCE.NS** - Reliance Industries Ltd.
- **TCS.NS** - Tata Consultancy Services Ltd.
- **HDFCBANK.NS** - HDFC Bank Ltd. (Should show in all 3 top rankings)
- **ICICIBANK.NS** - ICICI Bank Ltd.
- **INFY.NS** - Infosys Ltd.
- **WIPRO.NS** - Wipro Ltd.
- **MARUTI.NS** - Maruti Suzuki India Ltd.
- **TITAN.NS** - Titan Company Ltd.
- **DRREDDY.NS** - Dr. Reddy's Laboratories Ltd.

### Try in Dashboard:
1. Go to Dashboard tab
2. Search or scroll to find an Indian stock
3. Click to view detailed analysis
4. All metrics should work for Indian stocks too!

## 6. Verify All Features Working

### Checklist:
- [ ] Top Stocks tab appears in navigation
- [ ] All 3 sub-tabs work:
  - [ ] Top Earners shows 10 stocks sorted by daily %
  - [ ] Long-Term shows 10 stocks with investment scores
  - [ ] Best of Day shows 10 stocks with volume analysis
- [ ] Profile button shows in top-right
- [ ] Clicking profile button shows dropdown menu
- [ ] Menu contains user info and options
- [ ] Market Status shows both US and Indian markets
- [ ] Market indicators (🟢/🔴) show correct status
- [ ] Indian stocks appear alongside US stocks
- [ ] Tables are mobile-responsive

## 7. Check Console for Errors

Press **F12** in browser to open Developer Tools:

1. Click **Console** tab
2. Should see no red errors
3. API calls should show in Network tab
4. Look for any "Failed to fetch" messages (fallback data will still load)

## 8. Monitor Backend Logs

In the terminal running uvicorn, watch for:
- ✅ `GET /top/earners` - should see 200 status
- ✅ `GET /top/long-term` - should see 200 status
- ✅ `GET /top/daily` - should see 200 status
- ✅ `GET /market/status` - should see 200 status with dual market data

## Troubleshooting

### Issue: Top Stocks tab doesn't appear
**Fix:** Restart frontend with `npm start`

### Issue: Profile menu doesn't open
**Fix:** Check browser console for errors (F12), might be CSS issue

### Issue: Market Status shows error
**Fix:** Ensure `is_market_open()` returns proper format in backend

### Issue: Indian stocks don't load
**Fix:** Verify `.NS` suffix is correct, try `RELIANCE.NS`

### Issue: Backend returns 500 error
**Fix:** Check backend terminal for Python errors, might need to install missing packages

## Next Steps After Testing

1. **Customize:** Modify algorithms in `app/services.py` for different scoring
2. **Database:** Set up MySQL connection for persistent user data
3. **Performance:** Cache top stocks results (they don't need real-time updates)
4. **UI Polish:** Add charts for Top Stocks trends
5. **Alerts:** Set up notifications when stocks hit top rankings

---

**Happy Testing! 🚀**