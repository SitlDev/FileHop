import os
import re

def fix_html_structure(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Deduplicate info blocks (common issue)
    content = re.sub(r'(<div id="raise-info".*?</div>)\s*(<div id="raise-info".*?</div>)', r'\1', content, flags=re.DOTALL)
    
    # 2. Fix SEO section unclosed divs
    # Patterns like: <div> <h3>...</h3> <p>...</p> <div>
    # Should be: <div> <h3>...</h3> <p>...</p> </div>
    # We look for <div> starting a block in seo-grid and ensure it's closed.
    def fix_seo_grid(match):
        inner = match.group(1)
        # Find all <div> tags that don't have a closing </div> before the next <div> or end
        # This is hard with regex, but we can do a simple replacement if the pattern is consistent.
        inner = re.sub(r'<div>\s*(<h3>.*?</h3>\s*<p>.*?</p>)\s*(?=<div>|</div>|</section>)', r'<div>\1</div>\n', inner, flags=re.DOTALL)
        return f'<div class="seo-grid">\n{inner}\n</div>'

    content = re.sub(r'<div class="seo-grid">\s*(.*?)\s*</div>', fix_seo_grid, content, flags=re.DOTALL)

    # 3. Fix unclosed calc-containers and info-blocks
    # These usually happen in a sequence.
    # We'll split by the start tags and ensure each one is closed.
    
    tags_to_fix = ['calc-container', 'info-block']
    for tag_class in tags_to_fix:
        pattern = re.compile(f'<div (?:id=".*?" )?class="{tag_class}.*?">', re.DOTALL)
        parts = pattern.split(content)
        tags = pattern.findall(content)
        
        if len(tags) == 0:
            continue
            
        new_content = parts[0]
        for i in range(len(tags)):
            chunk = parts[i+1]
            # If this chunk doesn't have a closing </div> for the tag we just added
            # and it's not the last chunk (where it might be closed later)
            # OR if it's the last chunk and it's missing a </div>
            
            # Simple heuristic: if '</div>' is not in the chunk, add it.
            # But wait, the chunk might contain other nested divs.
            # So we check the balance.
            open_divs = chunk.count('<div')
            close_divs = chunk.count('</div>')
            
            if close_divs <= open_divs:
                # We are missing at least one </div> for the tag itself
                # We should insert it before the next tag or at the end of the container
                new_content += tags[i] + chunk + "</div>\n"
            else:
                new_content += tags[i] + chunk
                
        content = new_content

    # 4. Global balance check for the whole file
    # We expect <body> and <main> and <div class="container"> to be closed.
    # Let's count total <div> and </div>
    open_count = content.count('<div')
    close_count = content.count('</div>')
    
    if open_count > close_count:
        # Add missing closures before the footer or </body>
        missing = open_count - close_count
        closure = "</div>\n" * missing
        if '</footer>' in content:
            content = content.replace('</footer>', closure + '</footer>')
        elif '</body>' in content:
            content = content.replace('</body>', closure + '</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    root_dir = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'
    files = [f for f in os.listdir(root_dir) if f.endswith('.html')]
    for filename in files:
        if filename in ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'disclaimer.html']:
            continue
        filepath = os.path.join(root_dir, filename)
        fix_html_structure(filepath)

if __name__ == "__main__":
    main()
