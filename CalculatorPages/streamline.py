import os
import re

# Standardized Head block
HEAD_START = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZYBPSXSG5T"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-ZYBPSXSG5T');
    </script>
    <link rel="icon" href="favicon.svg" type="image/svg+xml">
    <link rel="icon" href="favicon.svg" sizes="any">
    <link rel="apple-touch-icon" href="apple-touch-icon.png">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#f5a623">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
"""

# Common Script inclusions
SCRIPTS = """
    <link rel="stylesheet" href="global.css">
    <script src="gate.js"></script>
    <script src="common.js"></script>
    <script src="sidebar.js"></script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5377169267581466" crossorigin="anonymous"></script>
</head>
"""

def streamline_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Standardize the <head> up to Title
    # Extract Title and Meta Description/Keywords
    title_match = re.search(r'<title>(.*?)</title>', content)
    desc_match = re.search(r'<meta name="description" content="(.*?)">', content)
    key_match = re.search(r'<meta name="keywords" content="(.*?)">', content)
    json_ld_match = re.search(r'<script type="application/ld\+json">.*?</script>', content, re.DOTALL)
    og_meta_match = re.findall(r'<meta property="og:.*?>', content)
    tw_meta_match = re.findall(r'<meta name="twitter:.*?>', content)

    title = title_match.group(0) if title_match else "<title>YourCalc — Premium Math Tools</title>"
    desc = desc_match.group(0) if desc_match else ""
    keys = key_match.group(0) if key_match else ""
    json_ld = json_ld_match.group(0) if json_ld_match else ""
    og_meta = "\n    ".join(og_meta_match)
    tw_meta = "\n    ".join(tw_meta_match)

    new_head = HEAD_START + "    " + title + "\n    " + desc + "\n    " + keys + "\n    " + json_ld + "\n    " + og_meta + "\n    " + tw_meta + SCRIPTS
    
    # Replace the old head
    content = re.sub(r'<!DOCTYPE html>.*?<body', new_head + '\n<body', content, flags=re.DOTALL)

    # 2. Remove redundant inline <style> and <script> (shared functions)
    # Remove large style blocks
    content = re.sub(r'<style>.*?</style>', '', content, flags=re.DOTALL)
    
    # Remove shared JS functions from the bottom script
    functions_to_remove = [
        r'function showTab\(.*?\)\s*{.*?}',
        r'function submitFeedback\(.*?\)\s*{.*?}',
        r'\(function\(\)\s*{\s*const saved = localStorage\.getItem\(\'calcTheme\'\).*?}\)\(\);'
    ]
    for func in functions_to_remove:
        content = re.sub(func, '', content, flags=re.DOTALL)

    # 3. Remove hardcoded Ad and Feedback sections
    content = re.sub(r'<div class="ad-unit">.*?</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<section class="feedback-section".*?</section>', '', content, flags=re.DOTALL)

    # 4. Cleanup Layout (standardize main container)
    # Ensure there is only one <main> and one <div class="container">
    # If there are redundant wrappers, flatten them
    
    # 5. Remove the redundant copyright paragraph (if any)
    content = re.sub(r'<p>© 2026 YourCalc — All tools are mathematically verified for precision. No data is stored on our servers.</p>', '', content)

    # Final cleanup of double blank lines
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    root_dir = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'
    files = [f for f in os.listdir(root_dir) if f.endswith('.html')]
    
    # Skip index.html for now as it has a very different layout, but let's see if we can streamline it too
    for filename in files:
        if filename in ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'disclaimer.html']:
            # For these pages, we do a lighter streamlining to preserve custom layouts
            continue
            
        filepath = os.path.join(root_dir, filename)
        print(f"Streamlining {filename}...")
        streamline_file(filepath)

if __name__ == "__main__":
    main()
