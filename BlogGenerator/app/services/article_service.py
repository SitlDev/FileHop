import os
import json
import re
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.core.config import Config

def get_posts_for_landing() -> List[Dict[str, Any]]:
    """Scans POSTS_DIR and returns sorted manifest of posts for the homepage."""
    posts = []
    if not os.path.exists(Config.POSTS_DIR):
        return []

    for filename in os.listdir(Config.POSTS_DIR):
        if not filename.endswith('.html'):
            continue
        
        filepath = os.path.join(Config.POSTS_DIR, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Extract metadata from HTML content (using regex)
            # This follows our current template pattern: <!-- category:XXX -->
            cat_m = re.search(r'<!-- category:(.*?) -->', content)
            category = cat_m.group(1) if cat_m else "general"
            
            title_m = re.search(r'<h1.*?>(.*?)</h1>', content, re.DOTALL | re.IGNORECASE)
            title = title_m.group(1).strip() if title_m else filename
            
            # Use mtime for sorting
            mtime = os.path.getmtime(filepath)
            
            # Extract first image for thumbnail
            img_m = re.search(r'<img.*?src=["\'](.*?)["\']', content, re.IGNORECASE)
            img = img_m.group(1) if img_m else None
            
            posts.append({
                'filename': filename,
                'title': title,
                'category': category,
                'img': img,
                'mtime': mtime,
                'url': f"/post/{filename}"
            })
        except Exception as e:
            print(f"[Article Service] Error reading {filename}: {e}")
            
    # Sort by mtime descending
    posts.sort(key=lambda x: x['mtime'], reverse=True)
    return posts

def get_post_content(filename: str) -> Optional[str]:
    """Retrieves full HTML content for a specific post."""
    filepath = os.path.join(Config.POSTS_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"[Article Service] Error reading {filename}: {e}")
    return None

def index_post(filename, title, date, img, category):
    """Updates the manifest index so home() doesn't have to rescan on every reload."""
    index = []
    if os.path.exists(Config.LANDING_INDEX_FILE):
        try:
            with open(Config.LANDING_INDEX_FILE, 'r') as f:
                index = json.load(f)
        except:
            pass
            
    # Remove existing if any
    index = [i for i in index if i.get('filename') != filename]
    
    # Add new entry at the start
    index.insert(0, {
        'filename': filename,
        'title': title,
        'date': date,
        'img': img,
        'category': category,
        'timestamp': time.time()
    })
    
    with open(Config.LANDING_INDEX_FILE, 'w') as f:
        json.dump(index[:100], f, indent=2) # Keep last 100

def create_styled_html(blog_data, news_metadata, provider_name, featured_image=None, detail_images=None, publish_date=None):
    """Create a world-class editorial HTML page for the blog post"""
    title = blog_data['title']
    content = blog_data['content']
    writer = blog_data['writer']
    
    writer_name = writer['name']
    writer_title = writer['title']
    writer_bio = writer.get('bio', 'Senior Correspondent at KnotStranded Media.')
    category = blog_data.get('category', news_metadata.get('category', 'general'))
    
    category_colors = {
        'tech': '#6366f1', 'movies': '#e11d48', 'tv': '#f43f5e', 'music': '#a855f7',
        'celebrity': '#ec4899', 'awards': '#f59e0b', 'streaming': '#06b6d4',
        'books': '#8b5cf6', 'finance': '#10b981', 'health': '#22c55e',
        'science': '#3b82f6', 'lifestyle': '#f97316', 'gaming': '#6366f1',
        'sports': '#ef4444', 'general': '#4f46e5'
    }
    accent_color = category_colors.get(category, '#4f46e5')
    
    formatted_content = content
    # Process Markdown
    formatted_content = re.sub(r'^###?\s*(.*)$', r'<h2>\1</h2>', formatted_content, flags=re.MULTILINE)
    if "<p>" not in formatted_content:
        paragraphs = formatted_content.split('\n\n')
        formatted_content = "".join([f"<p>{p.strip()}</p>" for p in paragraphs if p.strip()])
    
    formatted_content = re.sub(r'<(h[23])>(.*?)</\1>', lambda m: f'<{m.group(1)} class="editorial-heading">{m.group(2).replace("**", "").strip()}</{m.group(1)}>', formatted_content, flags=re.DOTALL)
    formatted_content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', formatted_content)
    
    # Image injection
    if not detail_images: detail_images = []
    for i in range(1, 5):
        marker = rf'\[?PHOTO{i}[^\]\n]*\]?'
        if re.search(marker, formatted_content, flags=re.IGNORECASE):
            img_src = f"/generated/{os.path.basename(detail_images[i-1])}" if i-1 < len(detail_images) else f"https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&seed={i}"
            formatted_content = re.sub(marker, f'<div class="inline-photo"><img src="{img_src}" alt="Detail {i}"></div>', formatted_content, flags=re.IGNORECASE)

    # Hero image
    img_html = f'<div class="hero-image-container"><img src="{featured_image if featured_image.startswith("http") else "/generated/" + os.path.basename(featured_image)}" class="hero-image" alt="{title}"></div>' if featured_image else ''

    # Final HTML Body (Simplified for the Blueprint)
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><title>{title} | KnotStranded</title>
    <style>:root {{ --accent: {accent_color}; --bg-body: #0a0a0a; --text-main: #fff; }} body {{ font-family: sans-serif; background: var(--bg-body); color: var(--text-main); line-height: 1.6; padding: 2rem; }} .article-content {{ max-width: 800px; margin: 0 auto; }} .hero-image {{ width: 100%; border-radius: 8px; margin-bottom: 2rem; }} .editorial-heading {{ border-left: 4px solid var(--accent); padding-left: 1rem; margin-top: 3rem; }}</style>
</head>
<body>
    <article class="article-content">
        <header><h1>{title}</h1><p>By {writer_name}</p></header>
        {img_html}
        {formatted_content}
    </article>
</body></html>"""
    return html
