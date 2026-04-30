import os
import re

def audit_cleanup(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove stray JS fragments at the start of <script> tags
    # These often look like: <script>\n\n         else {\n ... \n        }\n ... }
    content = re.sub(r'<script>\s*else\s*{.*?}\s*document\.querySelectorAll\(\'\.result-panel\'\)\.forEach\(p => p\.classList\.remove\(\'visible\'\)\);\s*}', '<script>', content, flags=re.DOTALL)
    
    # Generic cleanup for stray closing braces at start of script
    content = re.sub(r'<script>\s*}', '<script>', content)

    # 2. Fix broken layout nesting
    # Remove misplaced </div> after <section class="seo-section"...>
    content = re.sub(r'(<section class="seo-section".*?>)\s*</div>', r'\1', content)

    # 3. Deduplicate info-blocks
    # If a page has two sections with the same ID (e.g. id="bmi-info"), remove the second one.
    ids_found = set()
    def deduplicate_ids(match):
        full_tag = match.group(0)
        id_val = match.group(1)
        if id_val in ids_found:
            # Return a placeholder to remove the whole section? 
            # Or just return empty string. 
            # This is tricky because we need to find the matching </div>.
            return "<!-- REMOVED DUPLICATE ID " + id_val + " -->"
        ids_found.add(id_val)
        return full_tag

    # Simple approach for now: if we see an info-block ID twice, let's try to remove the second block.
    # We'll use a more surgical approach for known duplicates like 'bmi-info' or 'macros-info'.
    for dup_id in ['bmi-info', 'macros-info', 'vo2-info', 'orm-info', 'pace-info', 'hrz-info', 'burn-info']:
        # Match the first one and keep it, remove subsequent ones.
        parts = content.split(f'id="{dup_id}"')
        if len(parts) > 2:
            # We have duplicates.
            # Keep parts[0] and parts[1] (which is the first block)
            # Remove the others.
            # This is complex with regex. Let's try a different way.
            new_content = parts[0] + f'id="{dup_id}"' + parts[1]
            for i in range(2, len(parts)):
                # Remove until the next </div>
                rem = re.sub(r'^.*?>.*?</div>', '', parts[i], flags=re.DOTALL)
                new_content += rem
            content = new_content

    # 4. Remove extra introduction sections if they are identical
    # (Sometimes streamline.py might have left both the original and a new one)
    # We'll skip this for now as it's harder to detect without semantic analysis.

    # 5. Fix double closing of main/container
    # Ensure we don't have </div>\n</div>\n</main> twice.
    # This is also tricky. Let's look for specific junk patterns.

    # 6. Final cleanup of double script tags
    content = re.sub(r'</script>\s*<script>', '\n', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    root_dir = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'
    files = [f for f in os.listdir(root_dir) if f.endswith('.html')]
    
    for filename in files:
        if filename in ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'disclaimer.html']:
            continue
            
        filepath = os.path.join(root_dir, filename)
        print(f"Auditing {filename}...")
        audit_cleanup(filepath)

if __name__ == "__main__":
    main()
