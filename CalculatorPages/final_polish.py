import os
import re

def polish_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    in_script = False
    
    # 1. Basic line-by-line filtering
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Detect script start
        if '<script>' in line:
            in_script = True
            new_lines.append(line)
            continue
        if '</script>' in line:
            in_script = False
            new_lines.append(line)
            continue
            
        # Remove orphaned/junk lines
        if stripped == '<div' or stripped == '</div>' or stripped == '<div >':
            # Check if this is part of a sequence of junk
            continue
            
        if in_script:
            # Remove stray fragments at start of script
            # Look for lines that start with 'else {' or '}' without context
            # We'll be careful here. Only if it's within the first 5 lines of a script
            # and seems out of place.
            pass

        new_lines.append(line)

    content = "".join(new_lines)

    # 2. Advanced Regex Cleanup
    # Remove fragments like: <script>\n\n         else { ... }
    content = re.sub(r'<script>\s*else\s*{.*?}\s*document\.querySelectorAll\(\'\.result-panel\'\)\.forEach\(p => p\.classList\.remove\(\'visible\'\)\);\s*}', '<script>', content, flags=re.DOTALL)
    
    # Remove the specific fitness.html mess:
    # 282:     <div 
    # 284:     <div 
    content = re.sub(r'<div\s*\n\s*\n\s*<div\s*\n', '', content)

    # 3. Deduplicate Info Blocks (Keep the first, remove others)
    # We'll use a list of common info block IDs
    info_ids = ['bmi-info', 'macros-info', 'vo2-info', 'orm-info', 'pace-info', 'hrz-info', 'burn-info']
    for info_id in info_ids:
        pattern = re.compile(f'<div id="{info_id}".*?</div>', re.DOTALL)
        matches = list(pattern.finditer(content))
        if len(matches) > 1:
            # Keep the first match, remove the others
            # We'll do it from back to front to preserve indices
            for match in reversed(matches[1:]):
                content = content[:match.start()] + "<!-- Removed duplicate info block -->" + content[match.end():]

    # 4. Remove extra whitespace
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    
    # 5. Fix the <section class="seo-section"><div> issue
    content = re.sub(r'(<section class="seo-section".*?>)\s*</div>', r'\1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    root_dir = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'
    files = [f for f in os.listdir(root_dir) if f.endswith('.html')]
    for filename in files:
        if filename in ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'disclaimer.html']:
            continue
        filepath = os.path.join(root_dir, filename)
        polish_file(filepath)

if __name__ == "__main__":
    main()
