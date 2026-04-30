import re

with open('sidebar.js', 'r') as f:
    text = f.read()

# Remove margin-left: auto; from control-group
text = text.replace('        margin-left: auto;', '        margin-left: 32px;')

# Remove the old absolute link block
old_bottom = """        <div style="position:absolute; right: 16px; top: 32px; transform: translateY(-50%); font-size: 10px; color: var(--muted, #6b7280); opacity: 0.6; letter-spacing: 0.05em; display: flex; gap: 8px; align-items: center;">
            <a href="about.html" style="color: inherit; text-decoration: none;">About</a>
            <span>·</span>
            <a href="privacy.html" style="color: inherit; text-decoration: none;">Privacy</a>
            <span>·</span>
            <a href="terms.html" style="color: inherit; text-decoration: none;">Terms</a>
        </div>"""
text = text.replace(old_bottom, "")

# Modify the top row structure
# First, remove the old flex spacer
text = text.replace('<div style="flex:1;"></div>', '')

# Then insert the new flex spacer + header-links right after the control-group
old_control_close = """                <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Theme">
                    <svg id="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                </div>
            </div>
        </div>"""

new_control_close = """                <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Theme">
                    <svg id="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                </div>
            </div>
            
            <div style="flex:1;"></div>
            
            <div class="header-links" style="font-size: 11px; color: var(--muted); opacity: 0.8; letter-spacing: 0.05em; display: flex; gap: 16px; align-items: center; text-transform: uppercase;">
                <a href="about.html" style="color: inherit; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='inherit'">About</a>
                <span>·</span>
                <a href="privacy.html" style="color: inherit; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='inherit'">Privacy</a>
                <span>·</span>
                <a href="terms.html" style="color: inherit; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='inherit'">Terms</a>
            </div>
        </div>"""

text = text.replace(old_control_close, new_control_close)

with open('sidebar.js', 'w') as f:
    f.write(text)

print("Updated top row layout!")
