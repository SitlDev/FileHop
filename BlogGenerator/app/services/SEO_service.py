import os
import json
import re
import random
from datetime import datetime
from typing import List, Dict, Any
from app.core.config import Config
from app.core.constants import NEWS_CATEGORIES

def generate_tags(category: str, num_tags: int = 5) -> List[str]:
    """Retrieves or generates tags for a specific category."""
    cat_info = NEWS_CATEGORIES.get(category, {})
    tags = cat_info.get('tags', [])
    if not tags:
        tags = ['knotstranded', 'editorial', category]
    random.shuffle(tags)
    return tags[:num_tags]

def build_sitemap(posts: List[Dict[str, Any]], host_url: str) -> str:
    """Builds a Google-compliant sitemap.xml"""
    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    
    # Homepage
    xml.append(f'  <url><loc>{host_url.rstrip("/")}/</loc><priority>1.0</priority></url>')
    
    # Individual Articles
    for p in posts:
        loc = f"{host_url.rstrip('/')}/post/{p['filename']}"
        mtime = datetime.fromtimestamp(p.get('mtime', time.time())).strftime('%Y-%m-%d')
        xml.append(f'  <url><loc>{loc}</loc><lastmod>{mtime}</lastmod><priority>0.8</priority></url>')
        
    xml.append('</urlset>')
    return "\n".join(xml)

def build_robots_txt(host_url: str) -> str:
    """Builds a search-engine friendly robots.txt"""
    content = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /dashboard",
        "Disallow: /api/",
        "Disallow: /login",
        f"Sitemap: {host_url.rstrip('/')}/sitemap.xml"
    ]
    return "\n".join(content)
