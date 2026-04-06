// Verification script to check if loading text is removed
const fs = require('fs');
const path = require('path');

const stockDetailPath = path.join(__dirname, 'src', 'components', 'StockDetail.js');

try {
  const content = fs.readFileSync(stockDetailPath, 'utf8');

  if (content.includes('Loading data')) {
    console.log('❌ Loading text still present in StockDetail.js');
  } else {
    console.log('✅ Loading text successfully removed from StockDetail.js');
  }

  if (content.includes('<LoadingInsights query={symbol} />')) {
    console.log('✅ LoadingInsights component is present');
  } else {
    console.log('❌ LoadingInsights component missing');
  }

} catch (error) {
  console.log('Error reading file:', error.message);
}