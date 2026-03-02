import os
import re
import random

POSTS_DIR = 'knot_storage'

KEYWORDS = {
    "tech": "https://images.unsplash.com/photo-1518770660439-4636190af475",
    "finance": "https://images.unsplash.com/photo-1611974714028-ac6027a7d51b",
    "movies": "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
    "sports": "https://images.unsplash.com/photo-1504450758481-7338ef7525e2",
    "health": "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
    "gaming": "https://images.unsplash.com/photo-1542751371-adc38448a05e",
    "music": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    "us_politics": "https://images.unsplash.com/photo-1504711434969-e33886168f5c",
    "politics": "https://images.unsplash.com/photo-1504711434969-e33886168f5c"
}

def backfill():
    if not os.path.exists(POSTS_DIR):
        print("No posts found.")
        return

    files = sorted([f for f in os.listdir(POSTS_DIR) if f.endswith('.html')])
    print(f"Checking {len(files)} articles...")

    count = 0
    for filename in files:
        filepath = os.path.join(POSTS_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Improved check for HTML presence
        if '<div class="hero-image-container"><img' in content:
            continue

        # Detect category
        cat = 'general'
        cat_match = re.search(r'<!--\s*category:([\w_]+)\s*-->', content)
        if cat_match:
            cat = cat_match.group(1)
        
        # Pick image
        base_url = KEYWORDS.get(cat, "https://images.unsplash.com/photo-1495020689067-958852a7765e")
        img_url = f"{base_url}?auto=format&fit=crop&q=80&w=1200&seed={random.randint(1,2000)}"
        
        title_match = re.search(r'<h1>(.*?)</h1>', content)
        title = title_match.group(1) if title_match else "Editorial Image"
        
        img_html = f'\n\n        <div class="hero-image-container"><img src="{img_url}" class="hero-image" alt="{title}"></div>'
        
        # Inject after </header>
        if '</header>' in content:
            new_content = content.replace('</header>', '</header>' + img_html, 1)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Injected image into {filename} ({cat})")
            count += 1
        else:
            print(f"⚠️ No </header> found in {filename}")

    print(f"Done. Backfilled {count} articles.")

if __name__ == "__main__":
    backfill()
