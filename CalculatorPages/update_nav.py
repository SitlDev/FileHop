import re

with open('sidebar.js', 'r') as f:
    text = f.read()

# CSS adjustments
text = re.sub(r'--header-height: 72px', r'--header-height: 120px', text)

text = re.sub(
    r'\.nav-top-row \{[^}]*?justify-content: flex-start;\n    \}',
    r""".nav-top-row {
        display: flex;
        width: 100%;
        height: 64px;
        padding: 0 40px;
        align-items: center;
        justify-content: flex-start;
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .nav-bottom-row {
        display: flex;
        width: 100%;
        height: 56px;
        padding: 0 40px;
        align-items: center;
    }""",
    text
)

text = re.sub(r'margin-left: 32px;', r'margin-left: auto;', text)

# nav colors
text = text.replace('.nav-item:hover { color: #fff !important; }', '.nav-item:hover { color: var(--nav-color, #fff) !important; }')
text = text.replace('.nav-group.active .nav-item { border-bottom-color: var(--accent); color: var(--accent) !important; }', '.nav-group.active .nav-item { border-bottom-color: var(--nav-color, var(--accent)); color: var(--nav-color, var(--accent)) !important; }')
text = text.replace('.nav-group.active .nav-item svg { stroke: var(--accent); opacity: 1; }', '.nav-group.active .nav-item svg { stroke: var(--nav-color, var(--accent)); opacity: 1; }')


# JS template restructuring
# Look for the start of initNavbar string
old_top = """    let html = `
        <div class="nav-top-row">
            <div class="logo-container" onclick="location.href='index.html'">
                <div class="logo-img">
                    <svg class="logo-sigma" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="10" y="10" width="80" height="80" rx="20" stroke="var(--accent)" stroke-width="4" stroke-dasharray="8 4"/>
                        <path d="M35 30H65V35L45 50L65 65V70H35" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="75" cy="25" r="4" fill="var(--accent2)"/>
                    </svg>
                </div>
                <div class="logo-text">YOURCALC</div>
            </div>
            <div class="nav-items">
    `;"""

new_top = """    const cur = localStorage.getItem('calcCurrency') || 'USD';
    let html = `
        <div class="nav-top-row">
            <div class="logo-container" onclick="location.href='index.html'">
                <div class="logo-img">
                    <svg class="logo-sigma" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="10" y="10" width="80" height="80" rx="20" stroke="var(--accent)" stroke-width="4" stroke-dasharray="8 4"/>
                        <path d="M35 30H65V35L45 50L65 65V70H35" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="75" cy="25" r="4" fill="var(--accent2)"/>
                    </svg>
                </div>
                <div class="logo-text">YOURCALC</div>
            </div>
            <div style="flex:1;"></div>
            <div class="control-group">
                <a href="index.html#toolSearch" class="theme-toggle" title="Search all tools" style="color: var(--accent);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </a>
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
        </div>
        <div class="nav-bottom-row">
            <div class="nav-items">
    `;"""

text = text.replace(old_top, new_top)

# Update nav-group inside MENU_STRUCTURE loop
old_nav_group = """    MENU_STRUCTURE.forEach(item => {
        const isActive = item.url === currentPath;
        html += `
            <div class="nav-group ${isActive ? 'active' : ''}">"""
new_nav_group = """    MENU_STRUCTURE.forEach(item => {
        const isActive = item.url === currentPath;
        html += `
            <div class="nav-group ${isActive ? 'active' : ''}" style="--nav-color: ${item.color}">"""

text = text.replace(old_nav_group, new_nav_group)


old_bottom = """    const cur = localStorage.getItem('calcCurrency') || 'USD';
    html += `
            </div>
            <div class="control-group">
                <a href="index.html#toolSearch" class="theme-toggle" title="Search all tools" style="color: var(--accent);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </a>
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
        </div>
        <div style="position:absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--muted, #6b7280); opacity: 0.6; letter-spacing: 0.05em; display: flex; gap: 8px; align-items: center;">
            <a href="about.html" style="color: inherit; text-decoration: none;">About</a>
            <span>·</span>
            <a href="privacy.html" style="color: inherit; text-decoration: none;">Privacy</a>
            <span>·</span>
            <a href="terms.html" style="color: inherit; text-decoration: none;">Terms</a>
        </div>
    `;"""

new_bottom = """    html += `
            </div>
        </div>
        <div style="position:absolute; right: 16px; top: 32px; transform: translateY(-50%); font-size: 10px; color: var(--muted, #6b7280); opacity: 0.6; letter-spacing: 0.05em; display: flex; gap: 8px; align-items: center;">
            <a href="about.html" style="color: inherit; text-decoration: none;">About</a>
            <span>·</span>
            <a href="privacy.html" style="color: inherit; text-decoration: none;">Privacy</a>
            <span>·</span>
            <a href="terms.html" style="color: inherit; text-decoration: none;">Terms</a>
        </div>
    `;"""

text = text.replace(old_bottom, new_bottom)

with open('sidebar.js', 'w') as f:
    f.write(text)

print("Updated sidebar.js structurally!")
