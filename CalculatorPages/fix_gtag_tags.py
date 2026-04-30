import os
import re

def fix_gtag_script(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Look for the gtag config followed by a link or meta tag without a closing </script>
    # Specific pattern found:
    # gtag('config', 'G-ZYBPSXSG5T');
    # <link
    
    pattern = r"(gtag\('config', 'G-ZYBPSXSG5T'\);)(\s+)(<link|<meta)"
    replacement = r"\1\2</script>\2\3"
    
    if re.search(pattern, content):
        print(f"Fixing gtag script in {filepath}")
        new_content = re.sub(pattern, replacement, content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

def main():
    root_dir = '.'
    for filename in os.listdir(root_dir):
        if filename.endswith('.html'):
            fix_gtag_script(os.path.join(root_dir, filename))

if __name__ == "__main__":
    main()
