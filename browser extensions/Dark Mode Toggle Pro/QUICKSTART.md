# Quick Start Guide - Dark Mode Toggle Pro

## 5-Minute Setup

### 1. Create Folder Structure
```
dark-mode-extension/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
├── background.js
├── libs/
│   └── tinycolor.js
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### 2. Copy All Files
Copy these files into your extension folder:
- manifest.json
- popup.html, popup.css, popup.js
- content.js, background.js
- libs/tinycolor.js

### 3. Create Icons (Quick Placeholder)
Create 3 simple PNG files:
- **icon-16.png** - 16x16 pixels
- **icon-48.png** - 48x48 pixels  
- **icon-128.png** - 128x128 pixels

Easy method: Use any online PNG generator and download a moon 🌙 emoji as PNG.

Or use this minimal SVG for icon-128.png and scale it down:
```svg
<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#7c3aed" width="128" height="128" rx="32"/>
  <path d="M50 40 Q40 50 40 65 Q40 80 55 85 Q45 85 35 75 Q25 65 25 50 Q25 35 35 25 Q45 15 55 15 Q50 25 50 40Z" fill="#ffffff"/>
  <circle cx="85" cy="65" r="8" fill="#fbbf24" opacity="0.3"/>
  <circle cx="92" cy="40" r="5" fill="#fbbf24" opacity="0.2"/>
</svg>
```

### 4. Load into Chrome
1. Open `chrome://extensions/`
2. Turn on "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select your extension folder
5. Done! 🎉

### 5. Test It
- Click the 🌙 extension icon in toolbar
- Press **Ctrl+Shift+D** to toggle
- Right-click page → "Toggle Dark Mode"

## Essential Features Checklist

- [x] Dark mode toggle (one-click)
- [x] Font size adjuster
- [x] Color picker
- [x] Custom CSS injector
- [x] Per-site settings save
- [x] Keyboard shortcut (Ctrl+Shift+D)
- [x] Context menu integration
- [x] Premium upsell button
- [x] Settings export/import
- [x] Cloud sync toggle (disabled by default)

## File Sizes
- manifest.json: ~1 KB
- popup.html: ~5 KB
- popup.css: ~8 KB
- popup.js: ~7 KB
- content.js: ~10 KB
- background.js: ~4 KB
- libs/tinycolor.js: ~2 KB
- **Total: ~37 KB**

## Browser Compatibility
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave
- ⚠️ Firefox (requires manifest v2 backport)
- ⚠️ Safari (requires different approach)

## Common Bugs & Fixes

### Dark mode not working on a site
**Cause:** Site uses inline styles or Shadow DOM  
**Fix:** Use CSS tab to add `!important` rules
```css
body { background: #1a1a1a !important; color: #e0e0e0 !important; }
```

### Colors change back after refresh
**Cause:** Chrome reloaded content script  
**Fix:** This is normal - styles re-inject automatically

### Extension icon not showing
**Cause:** Chrome didn't load unpacked correctly  
**Fix:** 
1. Go to `chrome://extensions/`
2. Look for "Dark Mode Toggle Pro"
3. If missing, reload and try "Load unpacked" again

### Keyboard shortcut not working
**Cause:** Another extension using Ctrl+Shift+D  
**Fix:** 
1. Go to `chrome://extensions/shortcuts`
2. Find Dark Mode Toggle Pro
3. Change to different shortcut

### CSS not saving
**Cause:** CSS syntax error  
**Fix:**
1. Open browser console (F12)
2. Check for error messages
3. Validate CSS at css-validator.org

## Performance Tips

1. **Keep custom CSS minimal** - Large CSS slows pages
2. **Use !important sparingly** - Only when necessary
3. **Disable on heavy sites** - Reset if page sluggish
4. **Clear cache monthly** - `chrome://extensions` → Details → Clear

## Keyboard Shortcuts

| Action | Keys |
|--------|------|
| Toggle dark mode | `Ctrl+Shift+D` |
| Open popup | `Click icon` or `Alt+D` (custom) |
| Quick settings | `Right-click page` |

Customize: `chrome://extensions/shortcuts`

## Storage Limits

Chrome allows:
- **Per extension:** 10 MB max storage
- **Per site:** Unlimited CSS (stored locally)
- **Cloud sync:** Encrypted, 1 MB limit

You're safe even with 1000 sites configured.

## Keyboard Shortcut Setup

To set custom shortcut:
1. Go to `chrome://extensions/`
2. Scroll to bottom → "Keyboard shortcuts"
3. Find "Dark Mode Toggle Pro"
4. Click pencil icon, choose your shortcut
5. Save

Popular alternatives:
- `Ctrl+Alt+D` - Dark toggle
- `Ctrl+Shift+T` - Theme (if available)
- `Ctrl+.` - (period key) - Quick toggle

## Popup Window Size

Default: 380×600px (scrollable)

Resize if needed in popup.js:
```javascript
// Change document dimensions
html, body {
    width: 400px;  // wider
    height: 700px; // taller
}
```

## Testing Checklist

Before deploying to Web Store:

```
FUNCTIONALITY
☐ Dark mode toggles on all websites
☐ Font size adjusts in real-time
☐ Color picker changes background
☐ Custom CSS saves and applies
☐ Per-site settings persist
☐ Global settings apply to new sites

KEYBOARD SHORTCUTS
☐ Ctrl+Shift+D toggles dark mode
☐ No conflicts with other extensions
☐ Works on Chrome, Edge, Brave

CONTEXT MENU
☐ Right-click → "Toggle Dark Mode" works
☐ Right-click → "Open Settings" works

SETTINGS
☐ Export saves JSON file
☐ Import loads JSON file
☐ Reset clears all data
☐ Premium button opens (placeholder)

EDGE CASES
☐ Works on PDFs
☐ Works on Gmail/Google Docs
☐ Works on YouTube
☐ Works on GitHub
☐ Works on Reddit
☐ Works on Discord
☐ Handles iframes
☐ Handles dynamically loaded content

PERFORMANCE
☐ No lag on page load
☐ No memory leaks (check DevTools)
☐ Popup opens in <500ms
☐ CPU usage minimal when idle
```

## Next Steps After Launch

### Week 1: Polish
- Fix reported bugs
- Improve UI based on feedback
- Add more CSS templates

### Week 2: Features
- Add 2-3 professional themes
- Implement affiliate links
- Set up Premium payment

### Week 3: Marketing
- Launch on Product Hunt
- Post to Reddit communities
- Email to tech newsletters

### Month 2+
- Cloud sync (Premium)
- More themes
- Performance optimizations
- Firefox/Safari ports

## Estimated Development Time

- **MVP (current):** 6-8 hours
- **Polish & testing:** 4-6 hours
- **Deployment & marketing:** 2-4 hours
- **Total to first revenue:** ~16 hours

## Revenue Projection

Assuming 1000 monthly installs:
- **Premium conversion:** 2% = 20 subscribers @ $1.99 = **$40/mo**
- **Affiliate commissions:** 1% CTR × 10 clicks/day = **$20-50/mo**
- **First year potential:** $600-1200

Growth targets:
- Month 3: 5,000 installs → $200-400/mo
- Month 6: 10,000 installs → $400-800/mo
- Month 12: 50,000 installs → $2,000+/mo

## Support Resources

**Google Manifest V3 Docs:**
https://developer.chrome.com/docs/extensions/mv3/

**Chrome Storage API:**
https://developer.chrome.com/docs/extensions/reference/storage/

**Web Store Listing Best Practices:**
https://developer.chrome.com/docs/webstore/best-practices/

**CSS Validation:**
https://jigsaw.w3.org/css-validator/

---

**Installation Time:** 5 minutes  
**First revenue:** 2-4 weeks after launch  
**Maintenance:** ~5 hours/week
