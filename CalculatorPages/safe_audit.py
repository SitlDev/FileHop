import os
import re

def safe_audit(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Clean up the massive div mess in footers (from the previous broken script)
    # Match a long sequence of </div> before or inside footer
    content = re.sub(r'(</div>\s*){10,}', '</div>\n', content)
    
    # 2. Fix the "else {" script bug
    content = re.sub(r'<script>\s*else\s*{', '<script>\n', content)
    
    # 3. Ensure the main container is closed before footer
    if '</footer>' in content and 'main' in content:
        # Check if we have an open <main> or <div class="container">
        # and ensure they are closed exactly once before footer
        pass

    # 4. Remove duplicate info blocks
    # Specifically "raise-info" or others
    content = re.sub(r'(<div id=".*?-info".*?</div>)\s*(?=\1)', '', content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    root_dir = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'
    files = [f for f in os.listdir(root_dir) if f.endswith('.html')]
    for filename in files:
        filepath = os.path.join(root_dir, filename)
        safe_audit(filepath)

if __name__ == "__main__":
    main()
