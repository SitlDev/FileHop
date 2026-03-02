import re
import requests
import random
import json
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from app.core.constants import NEWS_CATEGORIES

TRENDS_CAT = {
    "movies":      "e", "tv": "e", "music": "e", "celebrity": "e", "awards": "e",
    "streaming":   "e", "books": "e", "gaming": "e", "local": "l", "tech": "t",
    "finance":     "b", "health": "m", "lifestyle": "b", "science": "t",
    "sports":      "s", "politics": "h", "us_politics": "h"
}

def crawl_full_article(url: str, timeout: int = 10) -> Optional[str]:
    """
    Fetch the full HTML from URL and extract main text content using simple heuristics.
    Strips script, style, and NAV tags to get the core story context.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code != 200:
            return None
        
        html = resp.text
        # Remove script and style elements
        html = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html, flags=re.DOTALL|re.IGNORECASE)
        # Remove common navigation/header/footer elements
        html = re.sub(r'<(nav|header|footer|aside)[^>]*>.*?</\1>', '', html, flags=re.DOTALL|re.IGNORECASE)
        # Remove HTML comments
        html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
        
        # Strip remaining tags to get raw text
        text = re.sub(r'<[^>]+>', ' ', html)
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text[:15000]
    except Exception as e:
        print(f"[Crawl] Failed to fetch {url}: {e}")
        return None

def search_trending_news(num_results: int, query_filter: str, categories: List[str]) -> Tuple[List[Dict[str, Any]], str]:
    """Scrapes Google Trends RSS for high-quality news leads."""
    unique_raw = []
    seen_links = set()
    
    # 1. Fetch loop
    for cat in categories:
        cat_code = TRENDS_CAT.get(cat, 'all')
        url = f"https://trends.google.com/trends/trendingsearches/daily/rss?geo=US&cat={cat_code}"
        try:
            r = requests.get(url, timeout=15)
            r.raise_for_status()
            root = ET.fromstring(r.text)
            for item in root.findall('.//item'):
                title = item.find('title').text
                link = item.find('link').text
                snippet = item.find('{https://trends.google.com/trends/trendingsearches/daily}description').text
                news_item_title = item.find('{https://trends.google.com/trends/trendingsearches/daily}news_item_title').text if item.find('{https://trends.google.com/trends/trendingsearches/daily}news_item_title') is not None else title
                
                if link not in seen_links:
                    unique_raw.append({
                        "title": news_item_title,
                        "link": link,
                        "snippet": snippet,
                        "trend_topic": title
                    })
                    seen_links.add(link)
        except Exception as e:
            print(f"[Curation] Error fetching {cat}: {e}")
            
    # 2. Filtering
    is_trending = len(categories) >= 6
    filtered_pool = []
    query_lower = (query_filter or "").lower().strip()
    
    for art in unique_raw:
        title_norm = art["title"].lower()
        snippet_norm = art.get("snippet", "").lower()
        combined = f"{title_norm} {snippet_norm}"
        
        # Simple category match for now (can be improved)
        matched_cat = "general"
        for c in categories:
            for kw in NEWS_CATEGORIES.get(c, {}).get('keywords', []):
                if kw.lower() in combined:
                    matched_cat = c
                    break
        
        art["category"] = matched_cat
        if query_lower and query_lower not in combined:
            continue
            
        filtered_pool.append(art)
        
    # 3. Dedup & Result construction
    result = []
    # (Simplified dedup for now, can bring back full similarity logic later if needed)
    for art in filtered_pool:
        if len(result) >= num_results: break
        domain_match = re.search(r"https?://(?:www\.)?([^/?#]+)", art["link"])
        source = domain_match.group(1) if domain_match else "Trends"
        result.append({
            "id": len(result) + 1,
            "title": art["title"],
            "link": art["link"],
            "source": source,
            "snippet": art["snippet"],
            "category": art["category"]
        })
        
    return result, None
