# Chrome Web Store Submission Guide

## ✅ ZIP File Ready

**File:** `dark-mode-toggle-pro.zip` (16 KB)

**Contents verified:**
- ✅ manifest.json
- ✅ popup.html, popup.css, popup.js
- ✅ content.js
- ✅ background.js
- ✅ libs/tinycolor.js
- ✅ icons/icon-16.png, icon-48.png, icon-128.png

**Status:** Ready to upload to Chrome Web Store

---

## 🚀 Step-by-Step Submission

### Step 1: Create Developer Account
1. Go to https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay $5 one-time developer fee
4. Accept Terms of Service

### Step 2: Upload ZIP File
1. Click **"New Item"** → **"Create"**
2. Click **"Choose File"** and select `dark-mode-toggle-pro.zip`
3. Click **"Upload"**
4. Wait for validation (usually 30 seconds)
5. Click **"Continue"**

### Step 3: Fill in Store Listing

#### Basic Information
- **Name:** Dark Mode Toggle Pro
- **Category:** Productivity
- **Language:** English (United States)

#### Detailed Description
```
Dark Mode Toggle Pro instantly transforms any website to dark mode 
with a single click.

FEATURES:
✨ One-Click Dark Mode Toggle (Ctrl+Shift+D)
- Intelligently inverts colors while preserving readability
- Per-site settings saved automatically
- Works on 99% of websites

🎨 Font & Color Customization
- Font size adjuster (80-150%)
- Custom text & background colors
- Line height & letter spacing controls
- Contrast presets (Normal, High, Low Vision)

💻 Custom CSS Injection
- Add custom CSS rules per site
- Live preview before saving
- Quick templates for popular sites
- Unlimited rules on Premium

☁️ Cloud Sync (Premium)
- Sync settings across all devices
- 5 professional themes
- Advanced controls
- Ad-free experience

QUICK START:
1. Install extension
2. Click icon or press Ctrl+Shift+D
3. Customize colors and fonts
4. Inject custom CSS if needed
5. Settings save automatically per site

KEYBOARD SHORTCUT: Ctrl+Shift+D (Cmd+Shift+D on Mac)

PRIVACY:
✅ All data stored locally
✅ No tracking without permission
✅ Works offline
✅ Respects Do Not Track

Free with optional Premium ($1.99/month):
- Professional themes
- Cloud sync
- Unlimited CSS rules
- Advanced contrast controls
- No ads

Perfect for:
- Night browsing
- Accessibility needs
- Eye strain reduction
- Website customization
- Developer testing

Support: Contact us for bugs or feature requests.
```

### Step 4: Upload Marketing Assets

#### Icon (128×128 PNG)
The icon is already included in the ZIP file and will be detected automatically.

#### Screenshots (4 required)
You need to create 4 screenshots (1280×800 PNG/JPG):

**Screenshot 1: Toggle Feature**
- Show dark mode applied to a website
- Show the extension popup with Toggle tab active
- Caption: "One-click dark mode toggle with Ctrl+Shift+D"

**Screenshot 2: Font & Color Customization**
- Show the Adjust tab with sliders
- Show color pickers
- Caption: "Customize fonts, colors, and contrast"

**Screenshot 3: Custom CSS**
- Show the CSS tab with example code
- Show the page with custom CSS applied
- Caption: "Inject custom CSS to fine-tune any site"

**Screenshot 4: Settings & Premium**
- Show the Settings tab
- Highlight the Premium button
- Caption: "Cloud sync, themes, and more with Premium"

### Step 5: Content Rating Questionnaire
1. Select "No" for all content categories
2. Submit for rating
3. Will receive content rating (usually same day)

### Step 6: Pricing & Distribution
1. **Pricing:** Free (optional premium in-app purchases)
2. **Countries:** All countries
3. **Distribution:** Public (available to everyone)

### Step 7: Privacy Policy
Add link to your privacy policy:
```
PRIVACY POLICY

Dark Mode Toggle Pro does not:
- Collect personal data
- Track browsing history
- Send data to external servers
- Display ads without permission
- Sell user information

Data Storage:
- Settings stored locally in Chrome storage
- Cloud sync (Premium only) uses encrypted storage
- No third-party data sharing

Contact: support@example.com
```

### Step 8: Permissions Justification

For each required permission, Google asks why you need it:

**activeTab**
"To detect the current website and apply dark mode settings appropriately."

**scripting**
"To inject dark mode CSS styles into web pages without requiring page reload."

**storage**
"To save user settings and preferences locally on their device."

**<all_urls>**
"To apply dark mode to any website the user visits."

**contextMenus**
"To add 'Toggle Dark Mode' option to the right-click context menu."

### Step 9: Review and Submit
1. Review all information
2. Check for any errors or warnings
3. Click **"Submit for Review"**
4. Wait for Google to review (typically 24-48 hours)

---

## 📋 Pre-Submission Checklist

```
BEFORE UPLOADING:
☐ ZIP file ready (dark-mode-toggle-pro.zip)
☐ All 7 core files included
☐ 3 icons included (16, 48, 128 PNG)
☐ No extra files (node_modules, .git, etc.)
☐ manifest.json validates as correct JSON
☐ All file paths in manifest are correct

STORE LISTING:
☐ Compelling title (Dark Mode Toggle Pro)
☐ Clear short description (max 132 chars)
☐ Detailed description written
☐ Privacy policy link ready
☐ Support email ready

GRAPHICS:
☐ 128×128 icon PNG (auto-included)
☐ 4 screenshots (1280×800 each)
  ☐ Screenshot 1: Toggle feature
  ☐ Screenshot 2: Customization
  ☐ Screenshot 3: CSS injection
  ☐ Screenshot 4: Premium features
☐ All images clear and professional

LEGAL:
☐ Privacy policy written and hosted
☐ Terms of service (if applicable)
☐ No trademark/copyright issues
☐ No illegal functionality

TESTING (Before uploading):
☐ Tested on 5+ websites
☐ All 4 tabs work
☐ Keyboard shortcut works (Ctrl+Shift+D)
☐ Context menu works (right-click)
☐ No console errors (F12)
☐ Export/import works
```

---

## 🎯 Expected Review Timeline

| Stage | Time |
|-------|------|
| Upload ZIP | Instant |
| Validation | 30 seconds - 5 min |
| Google Review | 24-48 hours |
| Approval | Auto-publish same day |
| **Total** | **~1-2 days** |

---

## ⚠️ Common Rejection Reasons & Fixes

| Reason | Fix |
|--------|-----|
| Icon missing | Check ZIP has icons/ folder |
| manifest.json error | Validate JSON syntax |
| Permissions unclear | Add detailed justification |
| Privacy policy missing | Add link or paste text |
| Test account required | Not needed for this extension |
| Functionality unclear | Improve description |

---

## ✨ After Approval

Once published:

1. **Share the URL**
   - Chrome Web Store page will be live
   - Share: https://chrome.google.com/webstore/detail/...

2. **Marketing**
   - Post to Reddit: r/chrome, r/webdev, r/privacy
   - Submit to Product Hunt
   - Share on Twitter with #ChromeExtension
   - Email tech newsletters

3. **Monitor**
   - Check reviews daily first week
   - Fix bugs quickly
   - Respond to user feedback
   - Track analytics

4. **Update**
   - New ZIP for each version
   - Submit to Web Store for review
   - Version number in manifest.json

---

## 💾 File Checklist

**ZIP file should contain:**
```
dark-mode-toggle-pro/
├── manifest.json              ✅
├── popup.html                 ✅
├── popup.css                  ✅
├── popup.js                   ✅
├── content.js                 ✅
├── background.js              ✅
├── libs/
│   └── tinycolor.js           ✅
└── icons/
    ├── icon-16.png            ✅
    ├── icon-48.png            ✅
    └── icon-128.png           ✅
```

**Should NOT include:**
- ❌ node_modules/
- ❌ .git/
- ❌ .DS_Store
- ❌ Documentation files
- ❌ Test files
- ❌ package.json

---

## 🆘 Troubleshooting

**Q: ZIP won't upload**
A: Validate JSON in manifest.json. Check all file paths are correct.

**Q: Icons don't appear**
A: Ensure PNG files are in `icons/` folder with correct names (icon-16.png, etc.)

**Q: Rejected for permissions**
A: Expand "Permissions" section in Store listing and explain each one.

**Q: Takes longer than 48 hours**
A: Sometimes Google's queue is full. Check email for rejection reason.

**Q: How to update after approval**
A: Upload new ZIP with updated version number in manifest.json.

---

## 📞 Support

For issues during submission:
- Check Chrome Web Store Help: https://support.google.com/chrome/a
- Chrome Extension Documentation: https://developer.chrome.com/docs/extensions/
- Manifest V3 Guide: https://developer.chrome.com/docs/extensions/mv3/

---

**Status:** ✅ Ready to submit  
**ZIP File:** dark-mode-toggle-pro.zip (16 KB)  
**Expected Launch:** 1-2 days from submission  
**Next Step:** Create screenshots and submit!
