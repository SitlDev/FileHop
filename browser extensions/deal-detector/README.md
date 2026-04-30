# Deal Detector — Chrome Extension

Analyzes sale prices in real-time and tells you if a discount is real or fake.

## Supported Retailers
- Amazon.com
- Walmart.com
- Target.com
- Best Buy
- eBay
- Home Depot

## How It Works

1. **Extracts** current price, claimed "was" price, and discount percentage from the product page
2. **Fetches** historical price data (Amazon products → CamelCamelCamel lookup)
3. **Analyzes** whether the current price is actually lower than historical prices
4. **Verdicts**:
   - ✅ **REAL DEAL** — Price is genuinely below historical average/high
   - 🚨 **FAKE DEAL** — Price is at or near its normal level despite the "sale" label
   - ⚠️ **PARTIAL DEAL** — Mild discount, below average but not a great deal
   - ❓ **UNVERIFIED** — Not enough history to confirm

## Install in Chrome (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select this `deal-detector` folder
5. The extension icon will appear in your toolbar

## Usage

1. Navigate to any product page on a supported retailer
2. Click the Deal Detector icon in your toolbar
3. Wait 1–2 seconds for analysis
4. Read the verdict

## Notes

- **Amazon**: Best results — uses CamelCamelCamel price history (90 days of data)
- **Other retailers**: Analysis based on page data only (claimed vs. current price). No external history API available without a paid service.
- For best results on Amazon, check products with at least a few weeks of history on CamelCamelCamel.

## Deal Score

The 0–100 score represents deal quality:
- **70–100**: Genuinely good price, buy now
- **45–69**: Okay deal, not exceptional  
- **0–44**: Poor deal or fake discount

## Files

```
deal-detector/
├── manifest.json       Chrome extension config
├── content.js          Extracts prices from retailer pages
├── background.js       Fetches price history (CamelCamelCamel)
├── analyzer.js         Deal analysis logic
├── popup.html          Extension UI
├── popup.js            UI rendering
└── icons/              Extension icons
```
