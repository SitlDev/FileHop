import os
import re

directory = "/Users/amn/Documents/GitHub/Claude/CalculatorPages"
files = [f for f in os.listdir(directory) if f.endswith(".html") and f not in ["index.html", "master_template.html", "about.html", "contact.html", "privacy.html", "terms.html", "disclaimer.html", "404.html", "branding_preview.html", "admin.html"]]

gold_footer = """    <footer class="site-footer">
        <div class="footer-links">
            <a href="index.html">Home</a>
            <a href="about.html">About</a>
            <a href="privacy.html">Privacy Policy</a>
            <a href="terms.html">Terms of Use</a>
            <a href="legal.html">Legal</a>
            <a href="disclaimer.html">Disclaimer</a>
            <a href="contact.html">Contact</a>
        </div>
        <p class="footer-copy">All calculations run in your browser. No data stored. No account required.</p>
        <p class="footer-copy" style="margin-top: 8px;">&copy; 2026 YourCalc &mdash; A KnotStranded LLC Product. All Rights Reserved.</p>
    </footer>"""

# Regex to find existing footer or main/body end
# Looking for <footer class="site-footer">...</footer> or <footer class="page-footer">...</footer>
footer_pattern = re.compile(r'<footer.*?>.*?</footer>', re.DOTALL)

for filename in files:
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if footer_pattern.search(content):
        new_content = footer_pattern.sub(gold_footer, content)
    else:
        # If no footer, insert before </body>
        if "</body>" in content:
            new_content = content.replace("</body>", gold_footer + "\n</body>")
        else:
            print(f"Skipping {filename}: No footer or </body> tag found.")
            continue

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated footer in {filename}")
    else:
        print(f"No changes needed in {filename}")
