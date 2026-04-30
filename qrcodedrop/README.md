# Tools Dashboard

A comprehensive suite of 41+ free online developer and productivity tools for QR codes, converters, formatters, encoders, generators, and utilities.

## 🚀 Features

### Core Tools (41 Total)

**Generators (6)**
- QR Code Generator - Multiple content types, dynamic codes, styling options
- UUID/GUID Generator - Create unique identifiers
- Password Generator - Secure password generation with customization
- Lorem Ipsum Generator - Placeholder text generation
- Coupon Code Generator - Bulk coupon creation
- Barcode Generator - Multiple barcode formats

**Converters (8)**
- Unit Converter - Length, weight, temperature, volume, speed
- Base Converter - Binary, octal, decimal, hexadecimal
- Timestamp Converter - Unix ↔ Human-readable dates
- CSV to JSON - Data format conversion
- YAML to JSON - Configuration conversion
- Color Converter - RGB, HEX, HSL formats
- Markdown to HTML - Real-time conversion
- Morse Code Converter - Text ↔ Morse code

**Encoders (4)**
- Base64 Encoder/Decoder - Text encoding
- URL Encoder/Decoder - URI encoding
- HTML Entity Encoder - HTML special characters
- Text Encryption - Caesar cipher encryption

**Formatters (4)**
- JSON Formatter - Format, minify, validate
- HTML/CSS Minifier - Reduce file sizes
- Text Case Converter - Case transformation
- URL Slug Generator - SEO-friendly slugs

**Vocabulary & Word Tools (10)**
- Anagram Solver - Find all anagrams
- Rhyme Generator - Find rhyming words
- Word Unscrambler - Unscramble letters
- Synonym Finder - Find similar words
- Antonym Finder - Find opposite words
- Scrabble Word Finder - Valid Scrabble words
- Homophones Finder - Words that sound alike
- Palindrome Checker - Palindrome detection
- Acrostic Generator - Create acrostic poems
- Portmanteau Generator - Blend words together

**Other Tools (9)**
- Regex Tester - Regular expression testing
- Hash Generator - SHA-256, SHA-512, SHA-1
- Text Statistics - Word/character analysis
- Diff Checker - Text comparison
- Markdown Preview - Live rendering
- Gradient Generator - CSS gradients
- JWT Debugger - Token decoding
- Analog Clock - Interactive time display
- Chemical Equation Balancer - Balance equations

### Platform Features
- **🎯 Analytics Dashboard** - Real-time usage statistics on main dashboard
- **📊 Admin Panel** - Password-protected analytics and subscriber management
- **💌 Newsletter System** - Email collection and subscriber management
- **📈 Usage Tracking** - Comprehensive event logging
- **🔐 Security** - HTTPS, security headers, CORS protection
- **📱 Responsive Design** - Mobile-friendly on all devices
- **⚡ Performance** - Static hosting, aggressive caching, CDN distribution
- **🎨 Dark Theme** - Easy on the eyes, modern interface

## 🛠 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Libraries**:
  - QRCodeStyling - Dynamic QR codes
  - BWIP-JS - Barcode generation
  - Lucide Icons - UI icons
  - Web Crypto API - Hash generation
- **Deployment**: Vercel (serverless, static)
- **Analytics**: Custom tracking system
- **Monetization**: Google AdSense

## 📁 Project Structure

```
/
├── index.html              # Landing page
├── style.css               # Global styles
├── DEPLOYMENT.md           # Production deployment guide
├── .env.example            # Environment template
├── vercel.json             # Deployment configuration
└── Tools/
    ├── dashboard.html      # Main tools directory
    ├── dashboard.js        # Tools listing & search
    ├── admin.html          # Analytics dashboard
    ├── qrcode/
    ├── barcode/
    ├── color/
    ├── jwt/
    ├── coupon/
    ├── gradient/
    ├── uuid/
    ├── password/
    ├── lorem/
    ├── regex/
    ├── base64/
    ├── unitconverter/
    ├── slug/
    ├── textcase/
    ├── markdown/
    ├── urlencoder/
    ├── hash/
    ├── textstats/
    ├── csvjson/
    ├── diff/
    ├── minifier/
    ├── baseconverter/
    ├── htmlencode/
    ├── yamlconverter/
    ├── timestamp/
    ├── markdownpreview/
    ├── encryption/
    └── docs/

├── sitemap.xml             # SEO sitemap
└── robots.txt              # Search engine crawling rules
```

## 🚀 Getting Started

### Local Preview
```bash
# Start local development server
python3 -m http.server 8000

# Or with Node.js
npx serve .

# Access at http://localhost:8000
```

### Deployment
The project is configured for Vercel deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

## 📊 Admin Dashboard

Access the analytics dashboard at `/Tools/admin.html` with password: `h14sua12`

Features:
- Real-time usage statistics
- Tool-specific analytics
- User activity logs
- Email subscriber management

## 📧 Email Collection

All tools include newsletter signup forms that:
- Appear after 30 seconds of usage
- Trigger on key actions (generate, download, copy)
- Store subscription status locally
- Send data to external API for processing

## 📈 SEO & Analytics

- Comprehensive meta tags for all pages
- Open Graph and Twitter Card support
- Google Analytics integration
- Custom event tracking for user interactions
- Sitemap and robots.txt for search engines

## 🤝 Contributing

This is a complete tool suite. For enhancements or new tools, please create an issue or submit a pull request.

## 📄 License

© 2026 Tools Dashboard. All rights reserved.

## Local Development

1. Clone the repository
2. Open `index.html` in your browser
3. Start generating QR codes!

## Deployment to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI: `npm install -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel`
4. Follow the prompts

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it as a static site
5. Deploy!

## Usage

1. Select the type of QR code (URL or WiFi)
2. Fill in the required information
3. Customize the appearance using colors and size
4. Download PNG or copy to clipboard

### WiFi QR Codes

WiFi QR codes allow devices to automatically connect to wireless networks. Fill in:
- Network Name (SSID)
- Password (if required)
- Security Type (WPA/WPA2, WEP, or No Password)

## License

MIT License