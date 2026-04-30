import os
import re

STANDARD_FOOTER = """
    <footer style="margin-top: 80px; padding: 40px 0; border-top: 1px solid var(--border); text-align: center; color: var(--muted); font-size: 13px;">
        <div style="display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-bottom: 24px;">
            <a href="index.html" style="color: var(--accent); text-decoration: none;">Home</a>
            <a href="about.html" style="color: var(--accent); text-decoration: none;">About</a>
            <a href="privacy.html" style="color: var(--accent); text-decoration: none;">Privacy</a>
            <a href="terms.html" style="color: var(--accent); text-decoration: none;">Terms</a>
            <a href="disclaimer.html" style="color: var(--accent); text-decoration: none;">Disclaimer</a>
            <a href="contact.html" style="color: var(--accent); text-decoration: none;">Contact</a>
        </div>
        <p>© 2026 YourCalc — All tools are mathematically verified for precision. No data is stored on our servers.</p>
    </footer>
"""

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove all existing footer candidates
    # We look for blocks that look like footers and contain copyright or precision text
    content = re.sub(r'<footer.*?>.*?</footer>', '', content, flags=re.DOTALL)
    
    # Remove div-based footers (usually at the end of main or before body)
    # This regex is more aggressive
    content = re.sub(r'<div[^>]*?>\s*<div[^>]*?>\s*<a href=".*?index.html".*?</a>.*?</div>\s*<p>.*?</p>\s*</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div[^>]*?>\s*<p>© 2026 YourCalc.*?</p>\s*</div>', '', content, flags=re.DOTALL)
    
    # 2. Specifically handle the "mathematically verified" paragraph which might be loose
    content = re.sub(r'<p>© 2026 YourCalc — All tools are mathematically verified for precision. No data is stored on our servers.</p>', '', content)

    # 3. Standardize Script Tags
    content = content.replace('src="/gate.js"', 'src="gate.js"')
    content = content.replace('src="/sidebar.js"', 'src="sidebar.js"')
    content = content.replace('href="/favicon.svg"', 'href="favicon.svg"')
    content = content.replace('href="/manifest.json"', 'href="manifest.json"')
    content = content.replace('href="/apple-touch-icon.png"', 'href="apple-touch-icon.png"')
    
    # 4. Standardize Navigation Links
    for page in ['index', 'about', 'privacy', 'terms', 'disclaimer', 'contact']:
        content = content.replace(f'href="/{page}.html"', f'href="{page}.html"')

    # 5. Inject the Footer correctly
    # We want it to be the last thing before </body>, but AFTER </main>
    if '</body>' in content:
        # Check if we already have the standard footer (to avoid double injection)
        if 'id="standard-footer"' not in content and 'Home' not in STANDARD_FOOTER: # Wait, I didn't add an ID
            pass
        
        # Let's add a unique comment to identify our footer
        labeled_footer = "\n    <!-- START STANDARD FOOTER -->" + STANDARD_FOOTER + "<!-- END STANDARD FOOTER -->\n"
        
        # Remove any previous "START STANDARD FOOTER" blocks first
        content = re.sub(r'\n\s*<!-- START STANDARD FOOTER -->.*?<!-- END STANDARD FOOTER -->\n', '', content, flags=re.DOTALL)
        
        content = content.replace('</body>', labeled_footer + '</body>')
    else:
        content += STANDARD_FOOTER

    # Final cleanup of excessive whitespace at the end of the file
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    root_dir = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'
    files = [f for f in os.listdir(root_dir) if f.endswith('.html')]
    
    for filename in files:
        filepath = os.path.join(root_dir, filename)
        fix_file(filepath)

if __name__ == "__main__":
    main()
