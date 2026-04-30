import os
import re

def fix_structure(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the unclosed info-block divs
    # Find all <div id="info-... or <div class="info-block...
    # and ensure they are closed.
    # Actually, a simpler way is to find the block of info-divs and re-wrap them.
    
    # First, let's fix the specific case where we have multiple info-blocks in a row with no closing </div>
    # Replace: <div id="info-1"... \n <div id="info-2"...
    # with: <div id="info-1"... </div> \n <div id="info-2"...
    content = re.sub(r'(<div id="info-.*?".*?>)(?=\s*<div id="info-)', r'\1</div>\n', content, flags=re.DOTALL)
    
    # And ensure the last one is closed before the next major tag
    content = re.sub(r'(<div id="info-.*?".*?>)(?=\s*</section>|\s*</main>|\s*<!--)', r'\1</div>\n', content, flags=re.DOTALL)

    # 2. Fix the SEO section / container nesting
    # Sometimes we have <section class="seo-section"> without a closing </section> 
    # or with too many </div>
    
    # 3. Clean up empty lines and weird fragments
    content = re.sub(r'<div\s*>\s*</div>', '', content)
    content = re.sub(r'<div>\s*</div>', '', content)
    
    # 4. Fix the specific "fitness.html" mess where info-blocks are nested
    # If we see <div id="info-vo2"> ... <div id="info-orm">
    # we should close info-vo2 before info-orm.
    # The regex in step 1 handles some of this, but let's be more robust.
    
    # Final check for unclosed divs in info-blocks
    info_matches = list(re.finditer(r'<div id="info-.*?".*?>', content))
    for i in range(len(info_matches)):
        start = info_matches[i].end()
        end = info_matches[i+1].start() if i+1 < len(info_matches) else len(content)
        chunk = content[start:end]
        if '</div>' not in chunk:
            # We need to insert a </div> before the next info-block or section end
            # Find a good spot (usually before the next <div or </section)
            next_tag = re.search(r'<div|</section|</main|<!--', chunk)
            if next_tag:
                insert_pos = start + next_tag.start()
                content = content[:insert_pos] + "</div>\n" + content[insert_pos:]
            else:
                # If no tag found, just append at the end of the chunk?
                # This is less likely.
                pass

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    root_dir = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'
    files = [f for f in os.listdir(root_dir) if f.endswith('.html')]
    for filename in files:
        if filename in ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'disclaimer.html']:
            continue
        filepath = os.path.join(root_dir, filename)
        fix_structure(filepath)

if __name__ == "__main__":
    main()
