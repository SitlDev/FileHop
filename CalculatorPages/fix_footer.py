import os
import re

STANDARD_FOOTER = """
    <!-- START STANDARD FOOTER -->
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
    <!-- END STANDARD FOOTER -->
"""

def fix_footer(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove any existing standard footer blocks
    content = re.sub(r'<!-- START STANDARD FOOTER -->.*?<!-- END STANDARD FOOTER -->', '', content, flags=re.DOTALL)
    # Remove any loose footer tags at the bottom
    content = re.sub(r'<footer.*?>.*?</footer>', '', content, flags=re.DOTALL)

    # Inject the new standard footer before </body>
    if '</body>' in content:
        content = content.replace('</body>', STANDARD_FOOTER + '</body>')
    else:
        content += STANDARD_FOOTER

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    root_dir = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'
    files = [f for f in os.listdir(root_dir) if f.endswith('.html')]
    for filename in files:
        filepath = os.path.join(root_dir, filename)
        fix_footer(filepath)

if __name__ == "__main__":
    main()
