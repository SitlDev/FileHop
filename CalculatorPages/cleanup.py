import os
import re

# Design tokens to ensure consistency
LIGHT_THEME_CSS = """        [data-theme="light"] {
            --bg: #f8f9fa;
            --surface: #ffffff;
            --border: #e9ecef;
            --text: #212529;
            --muted: #6c757d;
            --accent2: #2f855a;
        }
"""

THEME_JS = """    <script>
        (function() {
            const saved = localStorage.getItem('calcTheme') || 'dark';
            document.documentElement.setAttribute('data-theme', saved);
        })();
    </script>
"""

MAIN_TRANSITION = "transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip files that already have the light theme block processed (or index.html which is special)
    if 'index.html' in filepath:
        return

    # 1. Inject Theme JS if missing
    if 'sidebar.js' in content and 'localStorage.getItem(\'calcTheme\')' not in content:
        # Find where to inject - after sidebar.js script tag
        content = re.sub(r'(<script src="sidebar.js"></script>)', r'\1\n' + THEME_JS, content)

    # 2. Inject Light Theme CSS if missing
    if '[data-theme="light"]' not in content and ':root {' in content:
        # Find the end of :root block
        # Look for the closing brace of :root
        root_match = re.search(r':root\s*{[^}]*}', content, re.DOTALL)
        if root_match:
            end_pos = root_match.end()
            content = content[:end_pos] + '\n\n' + LIGHT_THEME_CSS + content[end_pos:]

    # 3. Standardization of main transition
    if 'main {' in content:
        # Replace existing transition or add if missing
        content = re.sub(r'main\s*{([^}]*)transition:[^;]*;', r'main {\1' + MAIN_TRANSITION, content)
        # If no transition at all:
        if 'transition:' not in re.search(r'main\s*{([^}]*)}', content, re.DOTALL).group(1):
             content = re.sub(r'main\s*{', r'main { ' + MAIN_TRANSITION + ' ', content)

    # 4. Standardize .container max-width to 800px
    content = re.sub(r'\.container\s*{([^}]*)max-width:[^;]*;', r'.container {\1max-width: 800px;', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Target directory
target_dir = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'

for filename in os.listdir(target_dir):
    if filename.endswith('.html'):
        update_file(os.path.join(target_dir, filename))
        print(f"Updated {filename}")
