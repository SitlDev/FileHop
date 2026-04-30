/**
 * YourCalc Dynamic Navigation Suite
 * Handles horizontal top-nav, localized numeric input formatting,
 * and site-wide branding consistency.
 */

// NOTE: Numeric locale formatting removed — it was patching HTMLInputElement.prototype.value
// globally and causing parseFloat() to misread formatted strings like "50,000" as 50.
// Calculator pages use type="number" inputs which the browser handles correctly natively.


const MENU_STRUCTURE = [
    // Money
    { name: 'Finance',     icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',                                                                                                                url: 'finance.html',      color: '#f5a623' },
    { name: 'Savings',     icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',                                                                                                                             url: 'savings.html',      color: '#38bdf8' },
    { name: 'Investments', icon: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6',                                                                                                                                       url: 'invest.html',       color: '#a78bfa' },
    { name: 'Real Estate', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',                                                                                                            url: 'real-estate.html',  color: '#f97316' },
    // Business
    { name: 'Business',    icon: 'M2 3h20v14H2z M8 21h8 M12 17v4',                                                                                                                                           url: 'business.html',     color: '#0ea5e9' },
    { name: 'Marketing',   icon: 'M11 5L6 9H2v6h4l5 4V5z M15.54 8.46a5 5 0 0 1 0 7.07',                                                                                                                     url: 'marketing.html',    color: '#ec4899' },
    { name: 'Logistics',   icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',                                            url: 'logistics.html',    color: '#64748b' },
    { name: 'Career',      icon: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',                                                  url: 'career.html',       color: '#22c55e' },
    // Health & Life
    { name: 'Health',      icon: 'M22 12h-4l-3 9L9 3l-3 9H2',                                                                                                                                                url: 'health.html',       color: '#3ecf8e' },
    { name: 'Fitness',     icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',                                                                                                                                          url: 'fitness.html',      color: '#f97316' },
    { name: 'Medical',     icon: 'M8 21h8M12 17v4M12 3a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4zM3 11h18v2H3z',                                                                                                        url: 'medical.html',      color: '#fb7185' },
    { name: 'Life Planning', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',                                                                      url: 'life.html',         color: '#f472b6' },
    { name: 'Parenting',   icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',                                                                                           url: 'parenting.html',    color: '#fde68a' },
    { name: 'Pets',        icon: 'M4.5 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M9 3.5a2.5 2.5 0 1 1 5 0 M19.5 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',                                               url: 'pets.html',         color: '#fb923c' },
    // Tech & Science
    { name: 'AI Costs',    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',                                                                                                                 url: 'ai-costs.html',     color: '#818cf8' },
    { name: 'Engineering', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',           url: 'engineering.html',  color: '#06b6d4' },
    { name: 'Science',     icon: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 1 2-2V9M9 21H5a2 2 0 0 0-2-2V9m0 0h18',                                                           url: 'science.html',      color: '#10b981' },
    { name: 'Academic',    icon: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5',                                                                                                                   url: 'academic.html',     color: '#fbbf24' },
    { name: 'Math',        icon: 'M18 4H6l6 8-6 8h12',                                                                                                                                                       url: 'math.html',         color: '#5eead4' },
    // Lifestyle
    { name: 'Auto',        icon: 'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11 M9 17h9a2 2 0 0 0 2-2v-4 M12 9h8l-1 4H12V9z M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M14 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',     url: 'auto.html',         color: '#94a3b8' },
    { name: 'Travel',      icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0',                                                                                 url: 'travel.html',       color: '#34d399' },
    { name: 'Green',       icon: 'M12 2a7 7 0 0 1 7 7c0 4-4 8-7 11-3-3-7-7-7-11a7 7 0 0 1 7-7z',                                                                                                            url: 'green.html',        color: '#4ade80' },
    { name: 'DIY',         icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',                                                                                                            url: 'diy.html',          color: '#f59e0b' },
    // Creative & Niche
    { name: 'Audio',       icon: 'M9 18V5l12-2v13M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',                                                                                  url: 'audio.html',        color: '#c084fc' },
    { name: 'Gaming',      icon: 'M6 12h4M9 9v6M15 11v.01M18 13v.01 M2 6h20v12H2z',                                                                                                                         url: 'gaming.html',       color: '#7dd3fc' },
    { name: 'Culinary',    icon: 'M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3',                                                                            url: 'culinary.html',     color: '#fdba74' },
    { name: 'Psychology',  icon: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',                                                                                                        url: 'psych.html',        color: '#e879f9' },
    { name: 'Spiritual',   icon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z',                                                                                                                                      url: 'spiritual.html',    color: '#a5b4fc' },
    { name: 'Survival',    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',                                                                                                               url: 'survival.html',     color: '#ef4444' },
    { name: 'Productivity',icon: 'M12 2 M12 2a10 10 0 1 0 0 20 M12 6v6l4 2',                                                                                                                                 url: 'productivity.html', color: '#67e8f9' },
    { name: 'Legal & Tax', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',                                                                                                              url: 'legal-tax.html',    color: '#fca5a5' },
    { name: 'Units',       icon: 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4',                                                                                                                       url: 'unit-converters.html', color: '#d1d5db' },
];


const NAV_CSS = `
    :root { 
        --sidebar-width: 0px !important; 
        --header-height: 120px; 
        --nav-bg: rgba(13, 15, 20, 0.8);
        --nav-item-bg: rgba(255, 255, 255, 0.03);
        --nav-text: rgba(255, 255, 255, 0.5);
        --nav-text-active: #ffffff;
        --nav-border: rgba(255, 255, 255, 0.08);
    }
    [data-theme="light"] {
        --nav-bg: rgba(255, 255, 255, 0.8);
        --nav-item-bg: rgba(0, 0, 0, 0.03);
        --nav-text: rgba(0, 0, 0, 0.6);
        --nav-text-active: #000000;
        --nav-border: rgba(0, 0, 0, 0.08);
    }
    html { scroll-padding-top: var(--header-height); }
    body { flex-direction: column !important; }
    main { margin-left: 0 !important; padding-top: calc(var(--header-height) + 40px) !important; width: 100% !important; transition: padding-top 0.3s ease; }
    main h1:first-of-type { margin-top: 0 !important; }

    .sidebar { 
        width: 100% !important; 
        height: var(--header-height) !important; 
        background: var(--nav-bg) !important; 
        backdrop-filter: blur(24px) saturate(180%);
        display: flex !important; 
        flex-direction: column !important; 
        border-right: none !important;
        border-bottom: 1px solid var(--nav-border);
        position: fixed; 
        top: 0; left: 0; 
        z-index: 2000;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-top-row {
        display: flex;
        width: 100%;
        height: 64px;
        padding: 0 24px;
        align-items: center;
        justify-content: flex-start;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        overflow: hidden;
    }
    .nav-bottom-row {
        display: flex;
        width: 100%;
        height: 56px;
        padding: 0 40px;
        align-items: center;
    }

    .logo-container { padding: 0 !important; margin-right: 40px; border: none !important; flex-shrink: 0; cursor: pointer; display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 0px; }
    .logo-img { width: 24px !important; height: 24px !important; display: flex; align-items: center; justify-content: center; }
    .logo-text { font-size: 12px !important; font-weight: 800; color: var(--nav-text-active); letter-spacing: 0.18em; line-height: 1; text-transform: uppercase; }
    .logo-sigma { width: 100%; height: 100%; }

    .nav-items { 
        display: flex !important; 
        flex-direction: row !important; 
        gap: 32px; 
        overflow-x: auto; 
        white-space: nowrap;
        scrollbar-width: none;
        height: 100%;
        align-items: center;
        flex: 1;
        scroll-behavior: smooth;
    }
    .nav-items::-webkit-scrollbar { display: none; }
    
    .nav-group { height: 100%; display: flex; align-items: center; position: relative; }
    .nav-item { 
        padding: 0 4px !important; 
        height: 100%; 
        display: flex; 
        align-items: center; 
        text-decoration: none;
        border-bottom: 3px solid transparent; 
        color: var(--nav-text) !important;
        font-size: 14px !important;
        font-weight: 600;
        gap: 10px !important;
        transition: all 0.2s;
    }
    .nav-item svg { width: 18px; height: 18px; opacity: 0.6; stroke-width: 2.2; transition: all 0.2s; }
    .nav-item:hover { color: var(--nav-color, #fff) !important; }
    .nav-item:hover svg { opacity: 1; }
    .nav-group.active .nav-item { border-bottom-color: var(--nav-color, var(--accent)); color: var(--nav-color, var(--accent)) !important; }
    .nav-group.active .nav-item svg { stroke: var(--nav-color, var(--accent)); opacity: 1; }
    
    .control-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
        flex-shrink: 0;
        padding: 4px;
        background: var(--nav-item-bg);
        border: 1px solid var(--nav-border);
        border-radius: 12px;
    }

    .nav-search-wrap {
        flex: 1;
        min-width: 0;
        max-width: 400px;
        margin: 0 20px;
        position: relative;
        display: flex;
        align-items: center;
    }
    /* Hide search on narrow screens to protect currency selector */
    @media (max-width: 600px) {
        .nav-search-wrap { display: none !important; }
    }
    /* Hide header-links on medium screens — keep currency always visible */
    @media (max-width: 1100px) {
        .header-links { display: none !important; }
    }
    .nav-search-input {
        width: 100%;
        height: 40px;
        background: var(--nav-item-bg);
        border: 1px solid var(--nav-border);
        border-radius: 10px;
        padding: 0 16px 0 42px;
        color: var(--nav-text-active);
        font-family: 'Outfit', sans-serif;
        font-size: 14px;
        transition: all 0.2s;
    }
    .nav-search-input:focus {
        outline: none;
        border-color: var(--accent);
        background: var(--nav-bg);
        box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.1);
    }
    .nav-search-icon {
        position: absolute;
        left: 14px;
        color: var(--muted);
        pointer-events: none;
        transition: color 0.2s;
    }
    .nav-search-input:focus + .nav-search-icon {
        color: var(--accent);
    }

    .currency-selector {
        display: flex;
        gap: 4px;
        padding-right: 12px;
        border-right: 1px solid rgba(255,255,255,0.08);
    }

    .currency-pill {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        color: var(--nav-text);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .currency-pill:hover { color: var(--nav-text-active); background: var(--nav-item-bg); }
    .currency-pill.active { color: var(--accent); background: rgba(245, 166, 35, 0.15); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

    .theme-toggle { 
        width: 32px; 
        height: 32px; 
        border-radius: 10px; 
        background: transparent; 
        flex-shrink: 0; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        cursor: pointer; 
        transition: all 0.2s; 
        color: var(--nav-text);
    }
    .theme-toggle:hover { color: var(--nav-text-active); background: var(--nav-item-bg); transform: rotate(12deg); }

    /* Google Translate Overrides */
    .goog-te-banner-frame.skiptranslate, .goog-te-gadget-icon { display: none !important; }
    body { top: 0px !important; }
    .goog-te-menu-value { display: none !important; }
    .goog-te-gadget { color: transparent !important; font-size: 0 !important; }
    .goog-te-gadget .goog-te-combo { 
        background: var(--surface) !important; 
        color: var(--text) !important; 
        border: 1px solid var(--border) !important; 
        border-radius: 8px !important; 
        padding: 4px 8px !important;
        font-family: 'Outfit', sans-serif !important;
        font-size: 13px !important;
        outline: none !important;
        cursor: pointer !important;
    }

    /* Ad Placements */
    .ad-slot { display: block; }
    
    /* Hide index ads on mobile */
    .is-index-page .ad-unit, .is-index-page .ad-top { display: none !important; }
    @media (max-width: 768px) {
        .is-index-page .ad-unit, .is-index-page .ad-top, .is-index-page .ad-bottom { display: none !important; }
    }


    .ad-gutter {
        position: fixed;
        top: calc(var(--header-height) + 40px);
        width: 160px;
        height: 600px;
        z-index: 100;
        display: none; /* Desktop only */
    }
    .ad-gutter-left { left: 40px; }
    .ad-gutter-right { right: 40px; }

    .ad-middle {
        width: 100%;
        max-width: 800px;
        height: 100px;
        margin: 0 auto 32px auto;
    }

    .ad-bottom {
        width: 100%;
        max-width: 970px;
        height: 250px;
        margin: 60px auto 40px auto;
    }

    @media (min-width: 1200px) {
        .ad-gutter { display: flex; }
        main { padding: 40px 200px !important; padding-top: calc(var(--header-height) + 40px) !important; }
    }

    @media (max-width: 768px) {
        .sidebar { padding: 0; height: auto !important; }
        .nav-top-row { padding: 0 16px; height: 60px !important; }
        .nav-bottom-row { display: none !important; }
        .header-links { display: none !important; }
        .logo-container { margin-right: 16px; flex-direction: row !important; gap: 0px !important; }
        .logo-text { display: block !important; font-size: 11px !important; margin-top: 0 !important; }
        .nav-items { gap: 16px; }
        .control-group { margin-left: auto; gap: 8px; }
        .nav-spacer { display: none !important; }
        .currency-selector { padding-right: 8px; }
        .ad-bottom { height: 100px; max-width: 100%; margin-top: 40px; }
    }

    .input-wrapper { position: relative; }
    .cur-prefix {
        position: absolute; left: 0; top: 0; height: 100%; width: 48px;
        display: flex; align-items: center; justify-content: center;
        font-family: 'DM Mono', monospace; font-size: 15px; font-weight: 600;
        color: var(--accent); pointer-events: none; border-right: 1px solid var(--border);
        letter-spacing: 0; z-index: 2; transition: color 0.2s;
    }
    .has-cur-prefix input { padding-left: 56px !important; }

    /* ── GLOBAL MOBILE OVERRIDES ── */
    @media (max-width: 768px) {
        :root { --sidebar-width: 0px !important; --header-height: 56px; }
        body { font-size: 15px; }
        main { padding: 24px 16px !important; padding-top: calc(var(--header-height) + 16px) !important; }
        h1 { font-size: 28px !important; text-align: center; }
        .subtitle { font-size: 14px !important; text-align: center; margin-bottom: 24px !important; }

    /* Top bar: logo + controls split-aligned */
    .nav-top-row { 
        padding: 0 12px; 
        height: var(--header-height) !important; 
        display: flex !important;
        justify-content: space-between !important; 
        align-items: center !important;
    }
    .logo-container { 
        margin-right: 0 !important; 
        flex-direction: row !important; 
        gap: 0px !important; 
        justify-content: flex-start !important;
        flex: 1;
    }
    .logo-text { display: block !important; font-size: 12px !important; margin-top: 0 !important; }

    .nav-items { display: none !important; }

    /* Push control group to the extreme right on mobile */
    .control-group {
        margin-left: auto !important;
        gap: 8px;
        padding: 2px 4px;
        justify-content: flex-end !important;
    }

        .currency-pill { width: 26px; height: 26px; font-size: 12px; border-radius: 8px; }
        .currency-selector { padding-right: 6px; gap: 2px; }
        .theme-toggle { width: 26px; height: 26px; border-radius: 8px; }
        .theme-toggle svg { width: 14px; height: 14px; }

        .calc-container { padding: 24px !important; border-radius: 16px !important; }
        .input-grid, .result-grid { grid-template-columns: 1fr !important; gap: 16px !important; }

        .tab-btn { padding: 8px 12px !important; font-size: 13px !important; }
        .btn-calculate { height: 52px !important; }

        .ad-gutter { display: none !important; }
        .ad-bottom { margin-top: 24px !important; height: auto !important; }
    }

    @media (max-width: 480px) {
        .logo-text { font-size: 12px !important; }


        .currency-selector { display: flex !important; } /* Always show currency on mobile */
    }

    /* Smooth Scrollbar for Nav */
    .nav-items { -webkit-overflow-scrolling: touch; }
    
    /* Table Responsive Fix */
    .result-panel { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .result-panel table { width: 100%; min-width: 600px; border-collapse: collapse; }

    /* ── SCROLL AFFORDANCE (all viewports) ── */
    /* Bottom nav: subtle warm tint */
    .mobile-bottom-nav {
        background: rgba(20, 17, 12, 0.92) !important;
        border-top: 1px solid rgba(245, 166, 35, 0.12) !important;
    }

    /* Fade-right gradient edge on scrollable tab strips */
    .tabs {
        position: relative;
    }
    .tabs::after {
        content: '';
        position: sticky;
        right: 0;
        top: 0;
        bottom: 0;
        width: 48px;
        flex-shrink: 0;
        background: linear-gradient(to right, transparent, var(--bg, #0d0f14));
        pointer-events: none;
    }

    /* Amortization / data table wrapper: slight surface tint + right fade */
    .amort-table-wrap {
        background: rgba(255,255,255,0.015);
        mask-image: linear-gradient(to right, black 85%, transparent 100%);
        -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    }
    /* Remove fade when fully scrolled isn't possible in CSS alone, so only apply on mobile */
    @media (max-width: 768px) {
        .amort-table-wrap {
            border-radius: 0 0 16px 16px;
        }
        /* Tint the tabs row to distinguish it as interactive/scrollable */
        .tabs {
            background: rgba(255,255,255,0.02);
            border-radius: 12px;
            padding: 6px 8px 6px 8px !important;
            margin-bottom: 20px;
        }
        /* Bottom nav: a slightly warm, distinct surface from the page */
        .mobile-bottom-nav {
            background: rgba(22, 18, 10, 0.95) !important;
            box-shadow: 0 -1px 0 rgba(245,166,35,0.15), 0 -8px 24px rgba(0,0,0,0.4) !important;
        }
        /* Scrollable result panels with tables get a tint frame */
        .result-panel {
            background: rgba(255,255,255,0.01);
            border-radius: 12px;
            padding: 4px;
        }
    }

    /* ── RESULT PANEL & INFO-BLOCK MOBILE OPTIMIZATIONS ── */
    @media (max-width: 768px) {
        /* Result cards */
        .result-item { padding: 14px 16px !important; border-radius: 12px !important; }
        .result-value { font-size: 22px !important; word-break: break-all; }
        .result-label { font-size: 10px !important; margin-bottom: 4px !important; }
        .result-panel { margin-top: 24px !important; padding-top: 24px !important; }

        /* Amortization / data tables */
        .amort-table th,
        .amort-table td { padding: 8px 10px !important; font-size: 11px !important; }
        .amort-toggle { padding: 12px 16px !important; font-size: 13px !important; }

        /* Info-blocks (educational content below results) */
        .info-block { margin-top: 20px !important; }
        .info-block h3 { font-size: 16px !important; margin-bottom: 8px; }
        .info-block h4 { font-size: 14px !important; margin-bottom: 6px; }
        .info-block p,
        .info-block li { font-size: 14px !important; line-height: 1.65 !important; }
        .info-block ul,
        .info-block ol { padding-left: 18px !important; }

        /* Generic result sub-text and footnotes */
        .result-note,
        .result-sub,
        .result-footer { font-size: 12px !important; line-height: 1.5 !important; }

        /* Tabs — allow horizontal scroll on mobile without wrapping */
        .tabs { padding-bottom: 4px !important; gap: 6px !important; }

        /* Community Discussion / Feedback section */
        .feedback-section { margin-top: 32px !important; }
        .feedback-section > div { padding: 20px !important; border-radius: 16px !important; }
        .feedback-section h3 { font-size: 18px !important; margin-bottom: 6px !important; }
        .feedback-section p { font-size: 13px !important; margin-bottom: 20px !important; }

        /* Stack name + email inputs vertically */
        .feedback-section div[style*="grid-template-columns"] {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            margin-bottom: 12px !important;
        }
        .feedback-section input[type="text"],
        .feedback-section input[type="email"] {
            padding: 12px 14px !important;
            font-size: 14px !important;
            border-radius: 10px !important;
        }
        .feedback-section textarea {
            padding: 12px 14px !important;
            font-size: 14px !important;
            height: 100px !important;
            border-radius: 10px !important;
            margin-bottom: 16px !important;
        }

        /* Full-width submit button on mobile */
        .btn-feedback {
            width: 100% !important;
            padding: 0 !important;
            height: 48px !important;
            font-size: 15px !important;
        }

        /* Comment thread spacing */
        .comment-thread { margin-top: 24px !important; padding-top: 24px !important; }
        .comment-thread > div { margin-bottom: 16px !important; }
        .comment-thread [style*="font-size: 13px"] { font-size: 12px !important; }
        .comment-thread [style*="font-size: 14px"] { font-size: 13px !important; line-height: 1.6 !important; }
    }

    /* ── BOTTOM NAV (MOBILE ONLY) ── */
    .mobile-bottom-nav {
        display: none;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: 64px;
        background: rgba(13, 15, 20, 0.9);
        backdrop-filter: blur(20px);
        border-top: 1px solid rgba(255,255,255,0.08);
        z-index: 3000;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        align-items: center;
        padding: 0 8px;
        scrollbar-width: none; /* Firefox */
    }
    .mobile-bottom-nav::-webkit-scrollbar { display: none; } /* Chrome/Safari */

    @media (max-width: 768px) {
        .mobile-bottom-nav { display: flex; }
        body { padding-bottom: 64px !important; } /* Space for bottom nav */
    }

    .bnav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        text-decoration: none;
        color: var(--muted);
        font-size: 10px;
        font-weight: 600;
        transition: all 0.2s;
        min-width: 72px; /* Fixed width for consistent scrolling */
        height: 100%;
    }
    .bnav-item svg { width: 20px; height: 20px; stroke-width: 2; color: var(--bnav-color, rgba(255,255,255,0.5)); transition: color 0.2s; }
    .bnav-item span { color: var(--bnav-color, rgba(255,255,255,0.5)); transition: color 0.2s; }
    .bnav-item.active svg, .bnav-item.active span { color: var(--bnav-color, var(--accent)); opacity: 1; }
    .bnav-item:active { transform: scale(0.9); }

    /* Smart Units */
    .smart-toggle { 
        position: absolute; right: 12px; top: 50%; transform: translateY(-50%); 
        background: rgba(255,255,255,0.05); border: 1px solid var(--border); 
        border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: 700; 
        color: var(--muted); cursor: pointer; z-index: 10; transition: all 0.2s; 
        display: none; height: 24px; align-items: center; justify-content: center;
    }
    .smart-toggle:hover { color: var(--text); background: rgba(255,255,255,0.1); border-color: var(--accent); }
    .smart-toggle.active { background: var(--accent); color: #000; border-color: var(--accent); }
    .input-wrapper.smart-active input:not(.ft-val, .in-val) { display: none !important; }
    .ft-in-grid { display: none !important; gap: 8px; width: 100%; height: 56px; }
    .input-wrapper.smart-active .ft-in-grid { display: grid !important; }
    .ft-in-input-wrap { position: relative; display: flex; align-items: center; width: 100%; }
    .ft-in-input-wrap span { 
        position: absolute; right: 12px; font-size: 10px; color: var(--muted); 
        pointer-events: none; font-weight: 700; text-transform: uppercase; 
    }
    .ft-in-grid input { padding-right: 32px !important; }
`;
    
function initNavbar() {
    if (!document.getElementById('nav-styles')) {
        const style = document.createElement('style');
        style.id = 'nav-styles';
        style.textContent = NAV_CSS;
        document.head.appendChild(style);
    }

    const container = document.querySelector('nav.sidebar');
    if (!container) return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    const cur = localStorage.getItem('calcCurrency') || 'USD';
    const isBlog = window.location.pathname.includes('/blog/');
    const base = isBlog ? '../' : '';

    let html = `
        <div class="nav-top-row">
            <div class="logo-container" onclick="location.href='${base}index.html'">
                <div class="logo-img">
                    <svg class="logo-sigma" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="10" y="10" width="80" height="80" rx="20" stroke="var(--accent)" stroke-width="4" stroke-dasharray="8 4"/>
                        <path d="M35 30H65V35L45 50L65 65V70H35" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="75" cy="25" r="4" fill="var(--accent2)"/>
                    </svg>
                </div>
                <div class="logo-text">YOURCALC</div>
            </div>
            
            <div class="nav-search-wrap">
                <input type="text" class="nav-search-input" placeholder="Search 100+ professional tools..." id="globalSearch" autocomplete="off">
                <svg class="nav-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            
            <div class="control-group">
                <div class="currency-selector">
                    <div class="currency-pill ${cur === 'USD' ? 'active' : ''}" onclick="setCurrency('USD')">$</div>
                    <div class="currency-pill ${cur === 'EUR' ? 'active' : ''}" onclick="setCurrency('EUR')">€</div>
                    <div class="currency-pill ${cur === 'GBP' ? 'active' : ''}" onclick="setCurrency('GBP')">£</div>
                </div>
                <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Theme">
                    <svg id="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                </div>
            </div>
            
            <div class="header-links" style="font-size: 11px; color: var(--muted); opacity: 0.8; letter-spacing: 0.05em; display: flex; gap: 14px; align-items: center; text-transform: uppercase; margin-left: 24px;">
                <a href="${base}blog/index.html" style="color: var(--accent); text-decoration: none; font-weight: 700;">Guides</a>
                <a href="${base}about.html" style="color: inherit; text-decoration: none;">About</a>
                <a href="${base}contact.html" style="color: inherit; text-decoration: none;">Contact</a>
                <a href="${base}contact.html?subject=suggestion" style="background: rgba(245, 166, 35, 0.1); color: var(--accent); padding: 6px 12px; border-radius: 6px; text-decoration: none; border: 1px solid rgba(245, 166, 35, 0.2); font-weight: 700;">Suggest a Tool</a>
            </div>
        </div>
        <div class="nav-bottom-row">
            <div class="nav-items">
    `;

    MENU_STRUCTURE.forEach(item => {
        const isActive = item.url === currentPath;
        html += `
            <div class="nav-group ${isActive ? 'active' : ''}" style="--nav-color: ${item.color}">
                <a href="${item.url}" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="${item.icon}"></path>
                    </svg>
                    ${item.name}
                </a>
            </div>
        `;
    });

    html += `
            </div>
        </div>

    `;

    container.innerHTML = html;
    
    // Search Logic
    setTimeout(() => {
        const globalSearch = document.getElementById('globalSearch');
        if (!globalSearch) return;

        const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
        
        globalSearch.addEventListener('input', (e) => {
            const q = e.target.value;
            if (isIndex) {
                const localSearch = document.getElementById('toolSearch');
                if (localSearch) {
                    localSearch.value = q;
                    localSearch.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        });

        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const q = globalSearch.value;
                if (!isIndex) {
                    const baseUrl = window.location.pathname.includes('/blog/') ? '../index.html' : 'index.html';
                    window.location.href = `${baseUrl}?q=${encodeURIComponent(q)}#toolSearch`;
                }
            }
        });

        // Handle incoming query param
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        if (query && isIndex) {
            globalSearch.value = query;
            setTimeout(() => {
                const localSearch = document.getElementById('toolSearch');
                if (localSearch) {
                    localSearch.value = query;
                    localSearch.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, 100);
        }
    }, 200);

    // Inject Bottom Nav for mobile
    injectBottomNav();
    
    injectAds();
    // Stamp money inputs after nav is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            stampCurrencyInputs();
            initSmartUnits();
        });
    } else {
        setTimeout(() => {
            stampCurrencyInputs();
            initSmartUnits();
        }, 50);
    }
    applyTheme();

    // Ensure active item is visible in horizontally scrolling nav
    setTimeout(() => {
        const activeItem = container.querySelector('.nav-group.active');
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
        }
    }, 100);
}

/**
 * SMART UNITS: Feet + Inches Toggle
 * Scans for height/length inputs and adds a toggle for fractional entry.
 */
function initSmartUnits() {
    document.querySelectorAll('.input-group').forEach(group => {
        const label = group.querySelector('label');
        if (!label) return;
        const text = label.textContent.toLowerCase();
        const select = group.querySelector('select.unit-select');
        const wrapper = group.querySelector('.input-wrapper');
        const mainInput = wrapper?.querySelector('input:not(.ft-val)');
        
        if (!mainInput || mainInput.classList.contains('smart-init')) return;

        // Detection: Height, Length, Width OR (in)/(ft) units
        const isLength = text.includes('height') || text.includes('length') || text.includes('width') || text.includes('drop') || text.includes('thickness');
        const hasLengthUnits = select && (Array.from(select.options).some(o => o.value === 'in' || o.value === 'ft'));
        const explicitlyInches = text.includes('(in)') || text.includes('(ft)');

        if (isLength || hasLengthUnits || explicitlyInches) {
            setupSmartToggle(group, mainInput, select);
        }
    });
}

function setupSmartToggle(group, mainInput, select) {
    const wrapper = mainInput.closest('.input-wrapper');
    if (!wrapper) return;

    mainInput.classList.add('smart-init');

    const toggle = document.createElement('div');
    toggle.className = 'smart-toggle';
    toggle.textContent = 'FT + IN';
    wrapper.appendChild(toggle);

    const grid = document.createElement('div');
    grid.className = 'ft-in-grid';
    grid.innerHTML = `
        <div class="ft-in-input-wrap"><input type="number" class="ft-val" placeholder="0"><span>FT</span></div>
        <div class="ft-in-input-wrap"><input type="number" class="in-val" placeholder="0"><span>IN</span></div>
    `;
    wrapper.appendChild(grid);

    const ftInput = grid.querySelector('.ft-val');
    const inInput = grid.querySelector('.in-val');

    function updateMain() {
        const ft = parseFloat(ftInput.value) || 0;
        const inch = parseFloat(inInput.value) || 0;
        const unit = select ? select.value : (group.textContent.includes('(ft)') ? 'ft' : 'in');
        
        if (unit === 'in') {
            mainInput.value = (ft * 12) + inch;
        } else {
            mainInput.value = ft + (inch / 12);
        }
        // Trigger input event for calculation logic in the page
        mainInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    ftInput.addEventListener('input', updateMain);
    inInput.addEventListener('input', updateMain);

    function syncFromMain() {
        if (wrapper.classList.contains('smart-active')) return;
        const val = parseFloat(mainInput.value) || 0;
        const unit = select ? select.value : (group.textContent.includes('(ft)') ? 'ft' : 'in');
        
        if (unit === 'in') {
            ftInput.value = Math.floor(val / 12);
            inInput.value = Math.round((val % 12) * 10) / 10;
        } else {
            ftInput.value = Math.floor(val);
            inInput.value = Math.round(((val % 1) * 12) * 10) / 10;
        }
    }

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const active = wrapper.classList.toggle('smart-active');
        toggle.classList.toggle('active', active);
        if (active) syncFromMain();
    });

    function checkVisibility() {
        const unit = select ? select.value : (group.textContent.includes('(ft)') || group.textContent.includes('(in)') ? (group.textContent.includes('(ft)') ? 'ft' : 'in') : null);
        if (unit === 'in' || unit === 'ft') {
            toggle.style.display = 'flex';
        } else {
            toggle.style.display = 'none';
            wrapper.classList.remove('smart-active');
            toggle.classList.remove('active');
        }
    }

    if (select) {
        select.addEventListener('change', checkVisibility);
        checkVisibility();
    } else if (explicitlyInches) {
        toggle.style.display = 'flex';
    }
    
    // Auto-update if main input changes via script
    const observer = new MutationObserver(() => syncFromMain());
    observer.observe(mainInput, { attributes: true, attributeFilter: ['value'] });
}

function injectAds() {
    if (document.querySelector('.ad-gutter')) return;
    const main = document.querySelector('main');
    if (!main) return;

    const path = window.location.pathname.split('/').pop() || 'index.html';
    const isIndex = path === 'index.html' || path === '';
    if (isIndex) document.body.classList.add('is-index-page');

    const isMobile = window.innerWidth < 768;
    
    // Rule 1: No ads on index page for mobile
    if (isMobile && isIndex) return;

    const PUB = 'ca-pub-5377169267581466';

    function makeAdUnit(className, format = 'auto', slot = '1234567890') {
        const wrap = document.createElement('div');
        wrap.className = className;
        wrap.innerHTML = `
            <div style="margin-bottom: 8px; text-align: center;">
                <span style="font-family: 'Outfit', sans-serif; font-size: 9px; letter-spacing: .2em; color: var(--muted); text-transform: uppercase;">Advertisement</span>
            </div>
            <ins class="adsbygoogle"
                 style="display:block; width:100%; height:100%;"
                 data-ad-client="${PUB}"
                 data-ad-slot="${slot}"
                 data-ad-format="${format}"
                 data-full-width-responsive="true"></ins>`;
        return wrap;
    }

    // Rule 2: Non-intrusive on mobile -> No top ad, only bottom.
    if (!isMobile) {
        // 1. Top Ad (Leaderboard) - Desktop/Tablet only
        const topAd = makeAdUnit('ad-top', 'horizontal', '3333333333');
        topAd.style.cssText = 'width: 100%; max-width: 800px; margin: 0 auto 40px auto; min-height: 90px;';
        const container = main.querySelector('.container');
        if (container) {
            container.insertBefore(topAd, container.firstChild);
        } else {
            main.insertBefore(topAd, main.firstChild);
        }
    }

    // 2. Left gutter ad (desktop 1200px+)
    const left = makeAdUnit('ad-gutter ad-gutter-left', 'vertical', '1111111111');
    document.body.appendChild(left);

    // 3. Right gutter ad (desktop 1200px+)
    const right = makeAdUnit('ad-gutter ad-gutter-right', 'vertical', '2222222222');
    document.body.appendChild(right);

    // 4. Bottom-of-page ad - Always show (except index mobile)
    const bot = makeAdUnit('ad-bottom', 'auto', '4444444444');
    bot.style.cssText = 'width: 100%; max-width: 800px; margin: 60px auto 0 auto; min-height: 250px;';
    const container = main.querySelector('.container');
    if (container) {
        container.appendChild(bot);
    } else {
        main.appendChild(bot);
    }

    // Activate all injected units
    document.querySelectorAll('.adsbygoogle').forEach(ins => {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
    });
}

function activateHashTab() {
    const hash = window.location.hash.substring(1);
    if (hash && typeof showTab === 'function') {
        showTab(hash);
    }
}

window.addEventListener('hashchange', activateHashTab);
window.addEventListener('load', activateHashTab);

window.setCurrency = function(code) {
    localStorage.setItem('calcCurrency', code);
    document.querySelectorAll('.currency-pill').forEach(p => {
        p.classList.toggle('active', p.innerText === getSym(code));
    });
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: code }));
    stampCurrencyInputs(code);
};

window.getCurrencySymbol = function() {
    const code = localStorage.getItem('calcCurrency') || 'USD';
    return getSym(code);
};

/**
 * Returns a live Intl.NumberFormat using the user's selected currency.
 * Call this inside each calculate function (not at module load time)
 * so it always reads the current value from localStorage.
 *
 * @param {number} [decimals=0] - maximumFractionDigits (0 = whole numbers, 2 = cents)
 */
window.getCurrencyFormatter = function(decimals = 0) {
    const code = localStorage.getItem('calcCurrency') || 'USD';
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: decimals
    });
};

// Auto-recalculate the active tab when the user switches currency
window.addEventListener('currencyChange', () => {
    // Find the visible (active) calculate button and click it
    const activeCont = document.querySelector('.calc-container.active');
    if (!activeCont) return;
    const btn = activeCont.querySelector('.btn-calculate');
    if (btn) btn.click();
});

function getSym(code) {
    if (code === 'EUR') return '€';
    if (code === 'GBP') return '£';
    return '$';
}

/**
 * Stamp currency symbol badges on all money-related inputs.
 * Detection is done by scanning the label text for financial keywords.
 * Injected once and updated on currency change — no per-page edits needed.
 */
const MONEY_LABEL_KEYWORDS = [
    'price', 'amount', 'payment', 'balance', 'salary', 'income', 'cost',
    'budget', 'revenue', 'expense', 'cash', 'debt', 'loan', 'principal',
    'savings', 'profit', 'worth', 'asset', 'liabilit', 'rent',
    'capital', 'fund', 'invest', 'earning', 'wage', 'fee',
    'spending', 'charge', 'contribution', 'deposit', 'withdrawal', 'credit',
    'burn', 'runway', 'payout', 'tax', 'tip'
];

function stampCurrencyInputs(code) {
    const sym = getSym(code || localStorage.getItem('calcCurrency') || 'USD');

    // Update existing prefix badges
    document.querySelectorAll('.cur-prefix').forEach(el => {
        el.textContent = sym;
    });

    // Inject new badges on inputs that don't have one yet
    document.querySelectorAll('.input-group').forEach(group => {
        const label = group.querySelector('label');
        if (!label) return;

        const labelText = label.textContent.trim().toLowerCase();
        
        // Exclude inputs with non-money units mentioned in label or specifically flagged
        if (labelText.includes('%') || labelText.includes('rate') || labelText.includes('percent') || 
            labelText.includes('ratio') || labelText.includes('years') || labelText.includes('multiplier') ||
            labelText.includes('(oz)') || labelText.includes('(kg)') || labelText.includes('(mi)') || 
            labelText.includes('(km)') || labelText.includes('(a)') || labelText.includes('(v)') ||
            labelText.includes('(l)') || labelText.includes('(gal)') || labelText.includes('(ft)') ||
            labelText.includes('(in)')) return;

        // Use word boundaries for more accurate matching (e.g., avoid "feeding" matching "fee")
        const isMoney = MONEY_LABEL_KEYWORDS.some(kw => {
            const regex = new RegExp('\\b' + kw + '\\b', 'i');
            return regex.test(labelText);
        });
        if (!isMoney) return;

        const wrapper = group.querySelector('.input-wrapper');
        if (!wrapper) return;

        const inp = wrapper.querySelector('input[type="number"], input:not([type])') || wrapper.querySelector('input');
        if (!inp || wrapper.querySelector('.cur-prefix')) return; // skip selects and already-stamped
        
        // Explicit bypass classes
        if (group.classList.contains('no-currency') || inp.classList.contains('no-currency')) return;

        // Skip IDs that look like percentages, rates, or counts
        const id = inp.id || '';
        if (id.match(/-[rdtyp]$|-rate$|-pct$|-yr$|-y$|-n$|-term|-age|-count|-qty/)) return;

        wrapper.classList.add('has-cur-prefix');
        const badge = document.createElement('span');
        badge.className = 'cur-prefix';
        badge.textContent = sym;
        wrapper.insertBefore(badge, wrapper.firstChild);
    });
}


function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('calcTheme', next);
    updateThemeUI(next);
}

function applyTheme() {
    const saved = localStorage.getItem('calcTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeUI(saved);
}

function updateThemeUI(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (theme === 'light') {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.07" x2="5.64" y2="17.66"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

function injectBottomNav() {
    if (document.querySelector('.mobile-bottom-nav')) return;
    
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    const bnav = document.createElement('div');
    bnav.className = 'mobile-bottom-nav';
    
    // Start with Home shortcut, then append all categories from MENU_STRUCTURE
    const homeActive = currentPath === 'index.html';
    let html = `
        <a href="index.html" class="bnav-item ${homeActive ? 'active' : ''}" style="--bnav-color:#f5a623">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span>Home</span>
        </a>
    `;

    // Use the full MENU_STRUCTURE so the bottom bar is always in sync
    MENU_STRUCTURE.forEach(item => {
        const isActive = item.url === currentPath;
        const color = item.color || 'rgba(255,255,255,0.5)';
        html += `
            <a href="${item.url}" class="bnav-item ${isActive ? 'active' : ''}" style="--bnav-color:${color}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="${item.icon}" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                <span>${item.name}</span>
            </a>
        `;
    });
    
    bnav.innerHTML = html;
    document.body.appendChild(bnav);

    // Scroll active item into view on bottom nav
    setTimeout(() => {
        const activeBNav = bnav.querySelector('.bnav-item.active');
        if (activeBNav) {
            activeBNav.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
        }
    }, 100);
}

// Always wait for DOMContentLoaded — sidebar.js is in <head>, so the <nav> doesn't
// exist yet at parse time. readyState tricks are unreliable here.
document.addEventListener('DOMContentLoaded', initNavbar);
/**
 * Site-wide Feedback Submission Logic
 * Dispatches UI state and sends data to /api/save-feedback
 */
window.submitFeedback = async function() {
    const btn = document.querySelector('.btn-feedback');
    const input = document.getElementById('feedbackComment');
    const nameInput = document.getElementById('feedbackName');
    const emailInput = document.getElementById('feedbackEmail');
    
    const comment = input?.value;
    const name = nameInput?.value || 'Anonymous';
    const email = emailInput?.value?.trim();

    // Validate comment
    if (!comment || comment.length < 3) {
        if (input) input.style.borderColor = 'var(--error)';
        return;
    }

    // Validate email (required)
    const emailOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
        if (emailInput) {
            emailInput.style.borderColor = 'var(--error)';
            emailInput.placeholder = 'Valid email required';
        }
        return;
    }

    // Reset error states
    if (emailInput) emailInput.style.borderColor = '';
    if (input) input.style.borderColor = '';

    
    const originalText = btn.innerText;
    btn.innerText = 'Sending...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/save-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                comment,
                url: window.location.href,
                email   // validated from the form field
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || errData.details || 'Failed');
        }

        btn.innerText = 'Sent! Thank you.';
        if(input) {
            input.value = '';
            input.style.borderColor = 'var(--border)';
        }
        setTimeout(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        }, 3000);

    } catch (e) {
        console.error('Feedback Error:', e);
        btn.innerText = e.message;
        btn.disabled = false;
    }
};

async function submitFeedback(parentId = null) {
    const prefix = parentId ? `reply-${parentId}-` : 'feedback';
    const name = document.getElementById(`${prefix}Name`)?.value || '';
    const email = document.getElementById(`${prefix}Email`)?.value || '';
    const comment = document.getElementById(`${prefix}Comment`)?.value || '';
    const handle = document.getElementById(`${prefix}Handle`)?.value || '';

    if (!email || !comment) {
        alert('Please provide at least an email and a comment.');
        return;
    }

    try {
        const res = await fetch('/api/save-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, handle, comment, url: window.location.href, parent_id: parentId })
        });
        const data = await res.json();
        if (data.success) {
            alert('Your comment has been submitted and is pending approval.');
            location.reload();
        } else {
            alert('Error: ' + (data.error || 'Unknown error'));
        }
    } catch (e) {
        alert('Failed to post comment. Please try again.');
    }
}

function showReplyBox(parentId, container) {
    if (document.getElementById(`reply-box-${parentId}`)) return;
    
    const replyBox = document.createElement('div');
    replyBox.id = `reply-box-${parentId}`;
    replyBox.style.cssText = 'margin-top:16px; padding:16px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid var(--border);';
    replyBox.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
            <input type="text" id="reply-${parentId}-Name" placeholder="Your Name" style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px; color:#fff; font-size:13px;">
            <input type="email" id="reply-${parentId}-Email" placeholder="Email (Required)" style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px; color:#fff; font-size:13px;">
        </div>
        <textarea id="reply-${parentId}-Comment" placeholder="Write your reply..." style="width:100%; height:80px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px; color:#fff; font-size:13px; resize:none; margin-bottom:12px;"></textarea>
        <div style="display:flex; gap:8px;">
            <button onclick="submitFeedback(${parentId})" style="background:var(--accent); color:#000; border:none; border-radius:8px; padding:8px 16px; font-weight:600; font-size:13px; cursor:pointer;">Post Reply</button>
            <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:var(--muted); font-size:12px; cursor:pointer;">Cancel</button>
        </div>
    `;
    container.appendChild(replyBox);
}

async function loadComments() {
    const thread = document.querySelector('.comment-thread');
    if (!thread) return;
    thread.style.minHeight = '200px';

    try {
        const res = await fetch(`/api/get-feedback?url=${encodeURIComponent(window.location.href)}`);
        const data = await res.json();
        
        if (data.comments && data.comments.length > 0) {
            thread.innerHTML = '<h3 style="font-size: 18px; font-weight: 600; margin-bottom: 24px; color: #fff;">Community Discussion</h3>';
            
            // Separate top-level comments and replies
            const topLevel = data.comments.filter(c => !c.parent_id);
            const replies = data.comments.filter(c => c.parent_id);

            const renderComment = (c, isReply = false) => {
                const date = new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const div = document.createElement('div');
                div.style.cssText = `margin-bottom: 24px; ${isReply ? 'margin-left: 32px; border-left: 2px solid var(--border); padding-left: 16px;' : ''}`;
                div.innerHTML = `
                    <div style="font-size: 13px; color: var(--muted); margin-bottom: 4px;">
                        <strong>${c.name || 'Anonymous'}</strong> ${c.handle ? `<span style="color:var(--accent);margin-left:4px;">@${c.handle}</span>` : ''} • ${date}
                    </div>
                    <div style="font-size: 14px; color: var(--text); line-height: 1.6; margin-bottom: 8px;">"${c.comment}"</div>
                    ${!isReply ? `<button class="btn-reply" data-id="${c.id}" style="background:none; border:none; color:var(--accent); font-size:12px; cursor:pointer; font-weight:600; padding:0;">Reply</button>` : ''}
                    <div class="reply-container" id="replies-to-${c.id}"></div>
                `;

                if (!isReply) {
                    div.querySelector('.btn-reply').onclick = (e) => showReplyBox(c.id, div.querySelector('.reply-container'));
                }

                return div;
            };

            topLevel.forEach(c => {
                const commentEl = renderComment(c);
                thread.appendChild(commentEl);
                
                // Add replies to this comment
                const children = replies.filter(r => r.parent_id === c.id);
                const childContainer = commentEl.querySelector('.reply-container');
                children.forEach(child => {
                    childContainer.appendChild(renderComment(child, true));
                });
            });
        }
    } catch (e) {
        console.error('Failed to load comments', e);
    }
}

// Global Expert Guide Content
const EXPERT_GUIDES = {
    'fitness': { title: 'Athletic Performance', accent: '--accent2', points: [{t:'VO₂ Max Precision', d:'Track metabolic efficiency and longevity.'}, {t:'Karvonen Method', d:'Target true anaerobic thresholds.'}] },
    'finance': { title: 'Wealth & Compounding', accent: '--accent', points: [{t:'Debt Velocity', d:'Snowball payments to save tens of thousands.'}, {t:'Sinking Funds', d:'Master your strategic growth targets.'}] },
    'engineering': { title: 'Structural Hub', accent: '--accent', points: [{t:'Beam Deflection', d:'Calculate integrity with professional constants.'}, {t:'Torque Dynamics', d:'Master industrial load-power ratios.'}] },
    'diy': { title: 'Precision Construction', accent: '--accent2', points: [{t:'The 10% Wastage Rule', d:'Account for subgrade compaction automatically.'}, {t:'Material Volumes', d:'Reduce overhead with geometric math.'}] },
    'default': { title: 'Precision Decision Hub', accent: '--accent', points: [{t:'Expert-Grade Logic', d:'Remove guesswork from professional calculations.'}, {t:'Efficiency & Accuracy', d:'High-precision math for every industry.'}] }
};

// Global Category Color Mapping - Perfectly Synced with index.html
const CATEGORY_COLORS = {
    'finance': '#f5a623',
    'savings': '#38bdf8',
    'invest': '#a78bfa',
    'real-estate': '#f97316',
    'business': '#0ea5e9',
    'marketing': '#ec4899',
    'career': '#16a34a',
    'logistics': '#64748b',
    'health': '#10b981',
    'life': '#f472b6',
    'pets': '#fb923c',
    'ai-costs': '#818cf8',
    'engineering': '#06b6d4',
    'science': '#10b981',
    'academic': '#fbbf24',
    'auto': '#94a3b8',
    'travel': '#34d399',
    'green': '#14532d',
    'diy': '#f59e0b',
    'audio': '#c084fc',
    'gaming': '#7dd3fc',
    'culinary': '#fdba74',
    'psych': '#e879f9',
    'spiritual': '#a5b4fc',
    'survival': '#ef4444',
    'fitness': '#f97316',
    'medical': '#fb7185',
    'parenting': '#fde68a',
    'productivity': '#67e8f9',
    'math': '#5eead4',
    'legal-tax': '#fca5a5',
    'unit-converters': '#d1d5db',
    'digital': '#ec4899'
};

function applyCategoryBranding() {
    const path = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    const color = CATEGORY_COLORS[path] || '#f5a623';
    
    // 1. Update Page Title (H1)
    const h1 = document.querySelector('h1');
    if (h1) {
        // Find if there's a nested span (our standard for accented words)
        const span = h1.querySelector('span');
        if (span) {
            span.style.color = color;
        } else {
            // Apply a subtle gradient or solid color to the whole H1
            h1.style.color = color;
        }
    }

    // 2. Update Nav Links
    document.querySelectorAll('.nav-link, .nav-item').forEach(link => {
        const href = link.getAttribute('href') || '';
        const linkPath = href.split('/').pop().replace('.html', '');
        const linkColor = CATEGORY_COLORS[linkPath];
        
        if (linkColor) {
            link.style.setProperty('--nav-hover-color', linkColor);
            link.style.setProperty('--nav-color', linkColor);
            
            // Side-nav specific indicator
            if (link.classList.contains('nav-link') && !link.querySelector('.cat-dot')) {
                const dot = document.createElement('span');
                dot.className = 'cat-dot';
                dot.style.cssText = `width:6px; height:6px; background:${linkColor}; border-radius:50%; margin-right:8px; opacity:0.6;`;
                link.prepend(dot);
            }
        }
    });
}

function injectExpertSection() {
    applyCategoryBranding();
    const main = document.querySelector('main');
    if (!main || document.querySelector('.feedback-section')) return;

    const path = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    const guide = EXPERT_GUIDES[path] || EXPERT_GUIDES['default'];
    const color = CATEGORY_COLORS[path] || '#f5a623';
    
    const section = document.createElement('div');
    section.className = 'container';
    section.style.cssText = 'margin-top: 80px; max-width: 800px; width: 100%;';
    
    section.innerHTML = `
        <section class="feedback-section" style="min-height: 400px; width: 100%;">
            <div style="margin-bottom: 64px; padding: 40px; background: var(--nav-item-bg); border: 1px solid var(--border); border-radius: 24px;">
                <h2 style="font-size: 32px; color: ${color}; margin-bottom: 24px;">Expert Guide: <span style="color: var(--nav-text-active);">${guide.title}</span></h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">

                    ${guide.points.map(p => `
                        <div style="background: var(--nav-item-bg); border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
                            <h4 style="color: var(--accent2); margin-bottom: 12px; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${p.t}</h4>
                            <p style="color: var(--muted); font-size: 14px; line-height: 1.8;">${p.d}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 40px;">
                <h3 style="font-size: 24px; margin-bottom: 8px;">Community Discussion</h3>
                <p style="color: var(--muted); font-size: 14px; margin-bottom: 32px;">Missing a feature? Share feedback to help us improve.</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <input type="text" id="feedbackName" placeholder="Your Name" style="background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; color: var(--text);">
                    <input type="email" id="feedbackEmail" placeholder="Email" required style="background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; color: var(--text);">
                </div>
                <input type="text" id="feedbackHandle" placeholder="Community Handle (e.g. @MathProphet)" style="width: 100%; margin-bottom: 20px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; color: var(--accent);">
                <textarea id="feedbackComment" placeholder="Share your suggestion or feedback..." style="width: 100%; height: 120px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; color: var(--text); font-family: inherit; resize: none; margin-bottom: 24px;"></textarea>
                <button class="btn-calculate btn-feedback" style="width: auto; padding: 0 40px;" onclick="submitFeedback()">Post to Thread</button>
                <div class="comment-thread" style="margin-top: 40px; border-top: 1px solid var(--border); padding-top: 40px;"></div>
            </div>
        </section>
    `;

    main.appendChild(section);
}



document.addEventListener('DOMContentLoaded', () => {
    // Other init items...
    injectExpertSection();
    if (typeof loadComments === 'function') loadComments();
});

