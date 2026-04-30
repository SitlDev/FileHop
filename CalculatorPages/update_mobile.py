import re

with open('sidebar.js', 'r') as f:
    text = f.read()

# Update mobile CSS to hide nav-bottom-row and header-links
old_mobile_css = """    @media (max-width: 1024px) {
        .sidebar { padding: 0; height: auto !important; }
        .nav-top-row { padding: 0 16px; height: 60px !important; }
        .nav-bottom-row { padding: 0 16px; }"""

new_mobile_css = """    @media (max-width: 1024px) {
        .sidebar { padding: 0; height: auto !important; }
        .nav-top-row { padding: 0 16px; height: 60px !important; }
        .nav-bottom-row { display: none !important; }
        .header-links { display: none !important; }"""

text = text.replace(old_mobile_css, new_mobile_css)

with open('sidebar.js', 'w') as f:
    f.write(text)

print("Updated mobile CSS to hide bottom row!")
