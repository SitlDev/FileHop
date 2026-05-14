# Dark Mode Toggle Pro - Architecture & Technical Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CHROME EXTENSION                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────┐     │
│  │   POPUP (UI/UX)      │      │  BACKGROUND SERVICE  │     │
│  ├──────────────────────┤      │    WORKER (Logic)    │     │
│  │ popup.html           │      ├──────────────────────┤     │
│  │ popup.css            │      │ background.js        │     │
│  │ popup.js             │      │                      │     │
│  │                      │      │ • Keyboard shortcuts │     │
│  │ • 4-tab interface    │      │ • Context menus      │     │
│  │ • Settings storage   │      │ • Tab management     │     │
│  │ • Color pickers      │      │ • Badge updates      │     │
│  │ • CSS editor         │      │ • Analytics          │     │
│  └──────────────────────┘      └──────────────────────┘     │
│           ▲                              ▲                   │
│           │ sends message                │ listens           │
│           └──────────────────┬───────────┘                   │
│                              │                               │
│                    ┌─────────▼──────────┐                    │
│                    │  CHROME STORAGE    │                    │
│                    │  chrome.storage    │                    │
│                    │       .sync        │                    │
│                    └────────────────────┘                    │
│                              ▲                               │
│                              │ reads/writes                  │
│                              │                               │
│                    ┌─────────▼──────────┐                    │
│                    │  CONTENT SCRIPT    │                    │
│                    ├────────────────────┤                    │
│                    │ content.js         │                    │
│                    │                    │                    │
│                    │ • CSS injection    │                    │
│                    │ • DOM observation  │                    │
│                    │ • Color inversion  │                    │
│                    │ • Custom CSS       │                    │
│                    └────────────────────┘                    │
│                              ▲                               │
│                              │ injects & modifies            │
│                              │                               │
│          ┌───────────────────▼──────────────────┐            │
│          │      WEB PAGE (Any Website)          │            │
│          ├───────────────────────────────────────┤            │
│          │                                       │            │
│          │ Original Styles                      │            │
│          │         +                            │            │
│          │ Injected Dark Mode CSS               │            │
│          │         +                            │            │
│          │ Custom User CSS                      │            │
│          │         =                            │            │
│          │ Transformed Page                     │            │
│          └───────────────────────────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Manifest (manifest.json)
**Declarative configuration** - Tells Chrome what the extension does

```
├── Basic Info
│   ├── version: 1.0.0
│   ├── name: "Dark Mode Toggle Pro"
│   └── description: "One-click dark mode..."
│
├── Permissions
│   ├── storage (save settings)
│   ├── activeTab (detect current site)
│   ├── scripting (inject CSS)
│   ├── contextMenus (right-click)
│   └── <all_urls> (work on any site)
│
├── UI Entry Points
│   ├── action (popup)
│   ├── background (service worker)
│   ├── content_scripts (page injection)
│   └── commands (keyboard shortcuts)
│
└── Icons
    ├── 16x16 (toolbar)
    ├── 48x48 (extension page)
    └── 128x128 (store)
```

### 2. Popup (popup.html + popup.css + popup.js)
**User-facing UI** - 380×600px window with 4 tabs

```
popup.html          popup.css           popup.js
├── Structure       ├── Variables        ├── Event Listeners
│   ├── Header      │   ├── Colors       │   ├── Tab switching
│   ├── Tabs        │   ├── Fonts        │   ├── Toggle switch
│   ├── Content     │   └── Spacing      │   ├── Color pickers
│   └── Footer      │                    │   ├── CSS editor
│                   ├── Components       │   └── Storage ops
│                   │   ├── Buttons      │
│                   │   ├── Sliders      ├── Functions
│                   │   ├── Inputs       │   ├── loadSettings()
│                   │   └── Toggles      │   ├── saveSettings()
│                   │                    │   ├── updateUI()
│                   └── Responsive       │   ├── applyPreset()
│                       └── Mobile       │   ├── injectStyles()
│                                        │   └── exportSettings()
```

### 3. Content Script (content.js)
**Injected into every webpage** - Handles dark mode generation and application

```
content.js
├── Initialization
│   ├── Load settings from storage
│   ├── Detect current site
│   └── Apply styles if enabled
│
├── Dark Mode Generation
│   ├── generateDarkModeCSS()
│   │   ├── Root colors
│   │   ├── Text elements
│   │   ├── Forms & inputs
│   │   ├── Cards & panels
│   │   ├── Code blocks
│   │   ├── Tables
│   │   └── Scrollbars
│   │
│   ├── Color Helpers
│   │   ├── shadeColor() - adjust brightness
│   │   └── adjustBrightness() - fine tune
│   │
│   └── Inject CSS
│       └── createElement('style') + appendChild()
│
├── Custom CSS Injection
│   ├── injectCustomCSS()
│   └── Apply per-site rules
│
├── DOM Observation
│   ├── MutationObserver watches new nodes
│   ├── Re-applies styles to dynamic content
│   └── Handles lazy-loaded components
│
└── Message Listener
    ├── Listen for popup commands
    ├── applyStyles action
    ├── injectCSS action
    └── Send confirmation back
```

### 4. Background Service Worker (background.js)
**Always-running logic** - Handles OS-level integration

```
background.js
├── Installation
│   ├── Initialize default settings
│   └── Set up context menus
│
├── Keyboard Shortcuts
│   ├── Ctrl+Shift+D → toggle dark mode
│   ├── Get current tab
│   └── Toggle per-site setting
│
├── Context Menu (Right-click)
│   ├── "Toggle Dark Mode"
│   ├── "Open Settings"
│   └── menuItemId handlers
│
├── Badge Management
│   ├── updateBadge() - show ✓ or blank
│   ├── onActivated - update on tab switch
│   └── Visual feedback to user
│
└── Storage Management
    ├── Respond to storage changes
    ├── Track premium status
    └── Analytics events
```

### 5. Data Storage (chrome.storage.sync)
**Cloud-synced settings** - Persists across sessions & devices

```
chrome.storage.sync
│
├── darkModeGlobal {
│   ├── darkModeEnabled: boolean
│   ├── defaultFontSize: 80-150
│   ├── defaultTextColor: hex color
│   ├── defaultBgColor: hex color
│   ├── theme: string (charcoal/midnight/etc)
│   ├── syncEnabled: boolean (premium)
│   └── contrastLevel: string (normal/high/low)
│
├── siteOverrides {
│   ├── "example.com" {
│   │   ├── darkModeEnabled: boolean
│   │   ├── defaultFontSize: number
│   │   ├── lineHeight: number
│   │   ├── textColor: hex
│   │   ├── bgColor: hex
│   │   ├── customCSS: string
│   │   └── contrastLevel: string
│   │
│   ├── "github.com" { ... }
│   └── "youtube.com" { ... }
│
├── isPremium: boolean
│   │ Unlocks:
│   │ • Professional themes
│   │ • Cloud sync
│   │ • Unlimited CSS rules
│   │ • Advanced controls
│   │ • Ad-free
│   │
│   └── Checked by popup on load
│
└── showAds: boolean
    └── Display affiliate recommendations
```

## Data Flow Diagrams

### Flow 1: User Toggles Dark Mode

```
User clicks toggle switch
         │
         ▼
popup.js: toggleDarkMode()
         │
         ├─ Update siteOverrides[site].darkModeEnabled
         ├─ Save to chrome.storage.sync
         └─ Send message to content script
              │
              ▼
         content.js receives message
              │
              ├─ Check settings
              ├─ Call applyDarkMode()
              ├─ Generate CSS
              ├─ Inject <style> tag
              └─ Watch for new content
                   │
                   ▼
         Page visually transforms
              │
              ├─ Background changes
              ├─ Text color inverts
              ├─ Links become blue
              └─ Images unaffected
                   │
                   ▼
              User sees dark mode
```

### Flow 2: User Customizes Colors

```
User moves font size slider
         │
         ▼
popup.js: updateFontSize()
         │
         ├─ Get slider value
         ├─ Update siteOverrides
         ├─ Save to storage
         ├─ Call injectStyles()
         └─ Send to content script
              │
              ▼
         content.js: applyDarkMode()
              │
              ├─ Read siteOverrides
              ├─ Pass fontSize to generateDarkModeCSS()
              ├─ Regenerate CSS with new size
              ├─ Replace old <style> tag
              └─ Apply immediately
                   │
                   ▼
         Page font size updates
```

### Flow 3: User Adds Custom CSS

```
User writes CSS in textarea
         │
         ▼
popup.js: saveCSS()
         │
         ├─ Validate syntax
         ├─ Save to siteOverrides[site].customCSS
         ├─ Call injectCustomCSS()
         └─ Send to content script
              │
              ▼
         content.js: injectCustomCSS()
              │
              ├─ Create new <style> tag
              ├─ Set textContent to user CSS
              ├─ Append to document.head
              └─ CSS applies immediately
                   │
                   ▼
         Page reflects custom rules
```

## CSS Injection Strategy

### Why Custom CSS is Powerful

```javascript
// Problem: Site has resistant inline styles
<div style="background: white; color: black;">
  Light content
</div>

// Solution: User's custom CSS overrides with !important
/* User's CSS */
div { background-color: #1a1a1a !important; color: #e0e0e0 !important; }

// Result: Dark mode applied despite inline styles
```

### CSS Specificity Hierarchy

```
Level 1 (lowest): Browser defaults
Level 2:          Site CSS (stylesheets)
Level 3:          Site inline styles
Level 4:          Extension dark mode CSS
Level 5 (highest): User custom CSS
```

All extension CSS uses `!important` to guarantee override.

## Performance Considerations

### Optimization Techniques

```
content.js
├── Avoid repainting
│   ├── Batch DOM updates
│   ├── Use CSS transforms (not layout)
│   └── MutationObserver debouncing
│
├── Lazy loading
│   ├── Only inject when needed
│   ├── Skip on disabled sites
│   └── Cache generated CSS
│
├── Memory management
│   ├── Remove old styles before new
│   ├── Clean up observers on unload
│   └── Limit MutationObserver scope
│
└── CSS optimization
    ├── Single <style> tag (not many)
    ├── Avoid wildcard selectors
    └── Use hardware acceleration
```

### Performance Metrics

| Operation | Time | Notes |
|-----------|------|-------|
| Popup load | <50ms | Cached settings |
| CSS injection | <100ms | Full page |
| Color picker | <10ms | Instant UI |
| Font slider | <50ms | Debounced |
| Custom CSS save | <200ms | Validation + storage |
| DOM observation | Negligible | Native Chrome |

## Security & Privacy

### Permissions Justification

```
manifest.json
├── storage
│   └── Why: Save user settings (required)
│
├── activeTab
│   └── Why: Detect current URL for per-site settings
│
├── scripting
│   └── Why: Inject CSS into pages
│
├── contextMenus
│   └── Why: Right-click menu integration
│
└── <all_urls>
    └── Why: Apply dark mode to any website
```

### No Data Exfiltration

```
✅ Settings stored locally (chrome.storage.sync)
✅ Cloud sync encrypted (if enabled)
✅ No tracking without permission
✅ No external API calls
✅ No user data shared with third parties
✅ Affiliate links clearly labeled
```

## Scalability

### How to Handle 1M+ Users

```
1. Load Distribution
   - Users' own Chrome instances handle CSS
   - No server-side computation needed
   - Scales infinitely

2. Storage
   - Local storage: Unlimited
   - Cloud sync: 1MB per account (enough for 10K sites)

3. Affiliate Revenue
   - Static links, no server calls
   - Analytics via Stripe/Paddle
   - No infrastructure needed

4. Updates
   - Chrome auto-updates extensions
   - No manual deployment needed
   - Batch updates daily
```

## Testing Strategy

### Unit Tests (popup.js)

```javascript
test('toggleDarkMode saves setting', async () => {
    const toggle = document.getElementById('darkModeToggle');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    
    const storage = await chrome.storage.sync.get();
    expect(storage.siteOverrides[currentSite].darkModeEnabled).toBe(true);
});
```

### Integration Tests (content.js)

```javascript
test('CSS injection applies to page', () => {
    applyDarkMode();
    const style = document.getElementById('dark-mode-style');
    expect(style).toBeTruthy();
    expect(style.textContent).toContain('background-color: #1a1a1a');
});
```

### E2E Tests (full extension)

```
1. Install extension
2. Open test website (YouTube, GitHub, etc.)
3. Click toggle → verify dark mode applies
4. Adjust font size → verify CSS updates
5. Add custom CSS → verify rules apply
6. Reload page → verify settings persist
7. Check other site → verify independent settings
```

## Deployment Pipeline

```
Local Development
    │
    ▼
Testing (local + real sites)
    │
    ▼
Code Review (self-check)
    │
    ├─ Performance profiling
    ├─ Memory leaks check
    ├─ Security audit
    └─ Documentation review
    │
    ▼
Build ZIP
    │
    └─ Remove test files
    └─ Minify if needed
    └─ Create upload package
    │
    ▼
Chrome Web Store
    │
    └─ Google auto-review (24-48h)
    └─ Publish when approved
    │
    ▼
Auto-Updates
    │
    └─ All users get new version
    └─ No manual update needed
```

## Future Architecture Improvements

### Version 2.0 Roadmap

```
Dark Mode Toggle Pro v2.0
├── Theme Engine
│   ├── Custom theme builder
│   ├── Share themes with users
│   └── Theme marketplace
│
├── AI Color Detection
│   ├── ML model to analyze page colors
│   ├── Auto-optimal dark mode
│   └── Per-element color intelligence
│
├── Sync System
│   ├── WebSync API for browser profile sync
│   ├── Multi-device settings
│   └── Settings backup/restore
│
├── Scheduling
│   ├── Automatic dark mode at sunset
│   ├── Per-site schedules
│   └── System dark mode integration
│
└── Analytics
    ├── Usage dashboard
    ├── A/B testing framework
    └── Premium conversion funnel
```

---

**Architecture Version:** 1.0  
**Last Updated:** May 2026  
**Complexity:** Medium (single-threaded, no backend)
