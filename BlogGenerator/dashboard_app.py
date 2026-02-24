#!/usr/bin/env python3
"""
KnotStranded Blog Generator - Complete Ultimate Edition
Categories + ChatGPT + Images + ClickBank + Squarespace Posting
"""

from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
import os
import json
from datetime import datetime
import anthropic
import threading
import re
import time
import random
import requests
from flask import request

app = Flask(__name__)
CONFIG_FILE = 'config.json'

# ============================================================================
# CATEGORIES
# ============================================================================

NEWS_CATEGORIES = {
    "movies": {
        "name": "Movies",
        "keywords": ["movie", "film", "cinema", "box office", "blockbuster"],
        "tags": ["cinema", "film review", "box office", "hollywood", "movie news"]
    },
    "tv": {
        "name": "TV Shows",
        "keywords": ["tv show", "television", "series", "streaming", "episode"],
        "tags": ["television", "tv series", "streaming", "binge watch", "tv news"]
    },
    "music": {
        "name": "Music",
        "keywords": ["music", "album", "concert", "artist", "song"],
        "tags": ["music industry", "albums", "concerts", "artists", "music news"]
    },
    "celebrity": {
        "name": "Celebrity News",
        "keywords": ["celebrity", "star", "actor", "actress", "famous"],
        "tags": ["celebrities", "hollywood stars", "entertainment", "pop culture"]
    },
    "awards": {
        "name": "Awards & Events",
        "keywords": ["oscar", "grammy", "awards", "festival", "ceremony"],
        "tags": ["awards season", "red carpet", "entertainment awards", "ceremonies"]
    },
    "streaming": {
        "name": "Streaming Services",
        "keywords": ["netflix", "disney+", "hulu", "streaming", "platform"],
        "tags": ["streaming wars", "netflix", "content", "digital entertainment"]
    },
    "books": {
        "name": "Books & Literature",
        "keywords": ["book", "novel", "author", "publishing", "bestseller"],
        "tags": ["literature", "bestsellers", "authors", "publishing", "book news"]
    },
    "gaming": {
        "name": "Gaming & Esports",
        "keywords": ["game", "gaming", "esports", "video game", "console"],
        "tags": ["video games", "esports", "gaming industry", "game releases"]
    },
    "local": {
        "name": "Local Pulse",
        "keywords": ["local news", "community", "city council", "regional", "hometown"],
        "tags": ["local", "community", "regional", "hometown", "local news"]
    }
}

# ============================================================================
# CLICKBANK PRODUCTS
# ============================================================================
# IMPORTANT: Replace these URLs with your actual ClickBank affiliate links!
# Format: https://[vendor].vendor.hop.clickbank.net/?affiliate=[YOUR_AFFILIATE_ID]

CLICKBANK_PRODUCTS = {
    "movies": [
        {"title": "Ultimate Streaming Guide", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "comprehensive streaming platform guide"},
        {"title": "Cinematography Masterclass", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "film appreciation course"},
        {"title": "Home Theater Setup", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "home entertainment system"}
    ],
    "tv": [
        {"title": "TV Series Database", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "complete series guide"},
        {"title": "Streaming Optimizer", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "streaming service comparison"},
        {"title": "Binge Guide Pro", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "TV recommendation engine"}
    ],
    "music": [
        {"title": "Music Production Mastery", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "music creation course"},
        {"title": "Concert Finder Pro", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "live music tracker"},
        {"title": "Music Theory Complete", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "music education"}
    ],
    "celebrity": [
        {"title": "Celebrity Style Guide", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "fashion course"},
        {"title": "Entertainment News Pro", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "news aggregator"},
        {"title": "Social Influence Course", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "influencer training"}
    ],
    "awards": [
        {"title": "Red Carpet Styling", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "fashion analysis tool"},
        {"title": "Event Planning Pro", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "ceremony guide"},
        {"title": "Industry Insider Access", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "exclusive event reports"}
    ],
    "streaming": [
        {"title": "VPN for Streaming", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "unlock global content"},
        {"title": "Smart DNS Setup", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "high-speed streaming tool"},
        {"title": "Content Discovery App", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "find trending shows fast"}
    ],
    "books": [
        {"title": "Author Success Blueprint", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "writing and publishing course"},
        {"title": "Speed Reading Mastery", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "read more books faster"},
        {"title": "Literary Analysis Pro", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "deep book study tool"}
    ],
    "gaming": [
        {"title": "Pro Gamer Reflexes", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "competitive gaming training"},
        {"title": "Game Dev Fundamentals", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "create your own games"},
        {"title": "E-sports Betting Guide", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "gaming analysis resource"}
    ],
    "default": [
        {"title": "Entertainment Insider", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "industry guide"},
        {"title": "Pop Culture Toolkit", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "analysis resource"},
        {"title": "Media Discovery Tool", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "content finder"}
    ]
}

AMAZON_PRODUCTS = {
    "movies": [
        {"title": "4K Projector for Home Cinema", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "bring the theater home"},
        {"title": "Movie Poster Collection", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "decorate your film room"},
        {"title": "Classic Cinema Blu-ray Box Set", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "must-see film collection"}
    ],
    "tv": [
        {"title": "OLED Smart TV 65-inch", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "ultimate binge watching experience"},
        {"title": "Universal Remote Control", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "manage all your devices"},
        {"title": "TV Backlight Ambient Lighting", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "immersive viewing setup"}
    ],
    "music": [
        {"title": "Noise Cancelling Headphones", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "pure audio bliss"},
        {"title": "Vinyl Record Player", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "classic sound experience"},
        {"title": "Portable Bluetooth Speaker", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "music wherever you go"}
    ],
    "celebrity": [
        {"title": "Designer Sunglasses", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "star-quality eye protection"},
        {"title": "Luxury Skincare Kit", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "red carpet ready skin"},
        {"title": "Professional Ring Light", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "look like an influencer"}
    ],
    "awards": [
        {"title": "Evening Gown Designer Book", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "history of red carpet fashion"},
        {"title": "Crystal Trophy Award Decor", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "elegant shelf piece"},
        {"title": "Smart Watch for Event Tracking", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "stay on schedule in style"}
    ],
    "streaming": [
        {"title": "Streaming Media Player Pro", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "fastest content access"},
        {"title": "Ethernet Adapter for TV", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "lag-free 4K streaming"},
        {"title": "Ergonomic Binge Pillow", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "ultimate comfort for marathons"}
    ],
    "books": [
        {"title": "Kindle Paperwhite", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "read thousands of books anywhere"},
        {"title": "Adjustable Book Stand", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "comfortable reading posture"},
        {"title": "Reading Lamp with Eye Protection", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "perfect night-time lighting"}
    ],
    "gaming": [
        {"title": "Mechanical Gaming Keyboard", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "ultra-fast response time"},
        {"title": "High-Precision Gaming Mouse", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "perfect accuracy in game"},
        {"title": "Gaming Headset with 7.1 Surround", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "hear everything in the game"}
    ],
    "local": [
        {"title": "Home Security Mastery", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "protect your local residence"},
        {"title": "Organic Gardening Guide", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "grow your own local food"},
        {"title": "Emergency Preparedness Pro", "url": "https://YOURVENDOR.hop.clickbank.net/?affiliate=YOURID", "description": "stay safe in your region"}
    ],
    "default": [
        {"title": "Digital Content Creator Kit", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "everything you need to start"},
        {"title": "Ergonomic Workspace Desk", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "write in comfort"},
        {"title": "Portable Power Bank", "url": "https://amazon.com/dp/B00EXAMPLES?tag=YOURTAG-20", "description": "stay charged on the move"}
    ]
}

def get_affiliate_links(category, num_cb=3, num_amz=3):
    """Get ClickBank and Amazon links for category"""
    cb_products = CLICKBANK_PRODUCTS.get(category, CLICKBANK_PRODUCTS["default"])
    amz_products = AMAZON_PRODUCTS.get(category, AMAZON_PRODUCTS["default"])
    
    cb_sample = random.sample(cb_products, min(num_cb, len(cb_products)))
    amz_sample = random.sample(amz_products, min(num_amz, len(amz_products)))
    
    return {"clickbank": cb_sample, "amazon": amz_sample}

DAILY_TIPS = {
    "movies": "Master the art of color grading in your home theater by adjusting the 'Warm 2' preset for a cinematic look.",
    "tv": "Use a specialized backlight kit to reduce eye strain during your next 10-hour binge session.",
    "music": "Clean your vinyl records with a carbon fiber brush before every play to preserve the grooves for decades.",
    "celebrity": "Follow stylists on 'Behind the Bling' for early leaks on red carpet trends before they hit the mainstream.",
    "awards": "Check the 'Shortlist' categories three months early to win your next Oscars betting pool.",
    "streaming": "Restart your router weekly to clear the cache and maintain 4K bitrate without buffering dips.",
    "books": "Try the 'pomodoro' reading method: 25 minutes of reading followed by a 5-minute break to increase retention.",
    "gaming": "Lower your mouse DPI to 800 for better muscle memory and precision in competitive shooters.",
    "local": "Join your local 'Buy Nothing' group to save money and strengthen community ties in your zip code."
}

def generate_tags(category):
    """Generate 3 tags for category"""
    tags = NEWS_CATEGORIES.get(category, {}).get("tags", ["entertainment", "news", "culture"])
    return random.sample(tags, min(3, len(tags)))

# ============================================================================
# WRITERS
# ============================================================================

def load_writers():
    """Load writer personalities"""
    try:
        with open('writers.json', 'r') as f:
            return json.load(f)['writers']
    except:
        return [{"id": 1, "name": "The Editor", "title": "Entertainment Writer"}]

def select_random_writer():
    """Select random writer"""
    return random.choice(load_writers())

# ============================================================================
# CONFIG
# ============================================================================

def load_config():
    """Load config"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.loads(f.read().strip() or '{}')
        except:
            return {}
    return {}

def save_config(config):
    """Save config"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except:
        return False

# ============================================================================
# GEOLOCATION
# ============================================================================

def get_location_from_ip():
    """Get location from user's IP address"""
    try:
        # Get IP accurately
        ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        # Use ip-api.com for free geolocation
        res = requests.get(f'http://ip-api.com/json/{ip if ip != "127.0.0.1" else ""}').json()
        
        if res.get('status') == 'success':
            return {
                'city': res.get('city'),
                'region': res.get('regionName'),
                'country': res.get('country'),
                'postal': res.get('zip'),
                'description': f"{res.get('city')}, {res.get('regionName')}"
            }
    except:
        pass
    return {'city': 'Unknown', 'region': 'Unknown', 'postal': 'Unknown', 'description': 'Unknown Location'}

# ============================================================================
# SEARCH - GEMINI
# ============================================================================

def search_with_gemini(api_key, num_results, query_filter, categories):
    """Search with Gemini"""
    try:
        import google.generativeai as genai
        
        print(f"[Gemini] Searching {num_results} articles in: {categories}")
        genai.configure(api_key=api_key)
        
        # Build query from categories
        keywords = []
        for cat in categories:
            keywords.extend(NEWS_CATEGORIES.get(cat, {}).get("keywords", []))
        
        if query_filter:
            query = f"Find {num_results} recent entertainment news about {query_filter} related to {', '.join(keywords[:5])}"
        elif 'local' in categories:
            loc = get_location_from_ip()
            # Use custom location if provided in config
            location_info = config.get('custom_location') or loc['description']
            postal_info = config.get('custom_zip') or loc['postal']
            query = f"Find {num_results} recent community news, city council decisions, and local events for {location_info} (around zip {postal_info}). If sparse, expand to the county and {loc['region']} state level. Return as high-content data points."
        else:
            query = f"Find {num_results} recent entertainment news about {', '.join(keywords[:5])}"
        
        model = genai.GenerativeModel('gemini-1.5-flash', tools='google_search')
        response = model.generate_content(query)
        
        # Parse results
        articles = []
        urls = re.findall(r'https?://[^\s<>"\')]+[^\s<>"\').,]', response.text)
        
        for i, url in enumerate(urls[:num_results], 1):
            pos = response.text.find(url)
            before = response.text[max(0, pos-300):pos]
            after = response.text[pos+len(url):pos+len(url)+300]
            
            # Extract title from text before URL
            lines = [l.strip() for l in before.split('\n') if l.strip()]
            
            # Filter out common non-title lines
            filtered_lines = []
            skip_phrases = ['full url', 'url:', 'source:', 'link:', 'article:', 'here', 'http']
            for line in lines:
                line_lower = line.lower()
                if len(line) > 10 and not any(phrase in line_lower for phrase in skip_phrases):
                    filtered_lines.append(line)
            
            # Use the last good line as title
            if filtered_lines:
                title = filtered_lines[-1]
            else:
                title = f"Entertainment News Article {i}"
            
            # Clean up title
            title = title.replace('**', '').replace('*', '').replace('#', '').strip()
            
            snippet_lines = [l.strip() for l in after.split('\n') if l.strip() and len(l.strip()) > 20]
            snippet = snippet_lines[0][:200] if snippet_lines else "Recent entertainment news."
            
            # Determine category
            text = (title + " " + snippet).lower()
            article_cat = "entertainment"
            for cat in categories:
                if any(kw in text for kw in NEWS_CATEGORIES.get(cat, {}).get("keywords", [])):
                    article_cat = cat
                    break
            
            articles.append({
                'id': i,
                'title': title[:100],
                'link': url,
                'source': re.search(r'https?://(?:www\.)?([^/]+)', url).group(1) if re.search(r'https?://(?:www\.)?([^/]+)', url) else 'Source',
                'snippet': snippet,
                'category': article_cat
            })
        
        print(f"[Gemini] ✓ Found {len(articles)} articles")
        return articles, None
        
    except Exception as e:
        print(f"[Gemini] ✗ Error: {str(e)}")
        return [], f"Gemini error: {str(e)}"

# ============================================================================
# SEARCH - CLAUDE
# ============================================================================

def search_with_claude(api_key, num_results, query_filter, categories):
    """Search with Claude"""
    try:
        print(f"[Claude] Searching {num_results} articles in: {categories}")
        client = anthropic.Anthropic(api_key=api_key)
        
        # Build query
        keywords = []
        for cat in categories:
            keywords.extend(NEWS_CATEGORIES.get(cat, {}).get("keywords", []))
        
        if query_filter:
            query = f"Find {num_results} recent entertainment news articles about {query_filter} related to {', '.join(keywords[:5])}. For each article, provide the title and URL."
        elif 'local' in categories:
            loc = get_location_from_ip()
            query = f"Find {num_results} recent community news and local headlines for {loc['description']} (Zip: {loc['postal']}). If news is sparse, expand search to {loc['region']} state level. Provide titles and URLs."
        else:
            query = f"Find {num_results} recent entertainment news articles about {', '.join(keywords[:5])}. For each article, provide the title and URL."
        
        print(f"[Claude] Query: {query}")
        
        message = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            tools=[{"type": "web_search_20250305", "name": "web_search"}],
            messages=[{"role": "user", "content": query}]
        )
        
        # DEBUG: Check what blocks we got
        print(f"[Claude] Response blocks: {len(message.content)}")
        for idx, block in enumerate(message.content):
            print(f"[Claude] Block {idx}: type={block.type}")
        
        response_text = "".join(block.text for block in message.content if block.type == "text")
        
        # DEBUG: Print response info
        print(f"[Claude] Response text length: {len(response_text)} chars")
        print(f"[Claude] First 500 chars: {response_text[:500]}")
        
        # Parse results
        articles = []
        urls = re.findall(r'https?://[^\s<>"\')]+[^\s<>"\').,]', response_text)
        
        print(f"[Claude] URLs found in response: {len(urls)}")
        if urls:
            print(f"[Claude] Sample URLs: {urls[:3]}")
        else:
            print(f"[Claude] ⚠️ NO URLS FOUND - Claude may not have used web search")
            print(f"[Claude] Full response:\n{response_text}")
        
        for i, url in enumerate(urls[:num_results], 1):
            pos = response_text.find(url)
            before = response_text[max(0, pos-300):pos]
            after = response_text[pos+len(url):pos+len(url)+300]
            
            # Extract title from text before URL
            lines = [l.strip() for l in before.split('\n') if l.strip()]
            
            # Filter out common non-title lines
            filtered_lines = []
            skip_phrases = ['full url', 'url:', 'source:', 'link:', 'article:', 'here', 'http']
            for line in lines:
                line_lower = line.lower()
                # Skip if line is too short or contains skip phrases
                if len(line) > 10 and not any(phrase in line_lower for phrase in skip_phrases):
                    filtered_lines.append(line)
            
            # Use the last good line as title, or generate one
            if filtered_lines:
                title = filtered_lines[-1]
            else:
                title = f"Entertainment News Article {i}"
            
            # Clean up title - remove markdown, special chars
            title = title.replace('**', '').replace('*', '').replace('#', '').strip()
            
            snippet_lines = [l.strip() for l in after.split('\n') if l.strip() and len(l.strip()) > 20]
            snippet = snippet_lines[0][:200] if snippet_lines else "Recent entertainment news."
            
            text = (title + " " + snippet).lower()
            article_cat = "entertainment"
            for cat in categories:
                if any(kw in text for kw in NEWS_CATEGORIES.get(cat, {}).get("keywords", [])):
                    article_cat = cat
                    break
            
            articles.append({
                'id': i,
                'title': title[:100],
                'link': url,
                'source': re.search(r'https?://(?:www\.)?([^/]+)', url).group(1) if re.search(r'https?://(?:www\.)?([^/]+)', url) else 'Source',
                'snippet': snippet,
                'category': article_cat
            })
        
        if articles:
            print(f"[Claude] ✓ Found {len(articles)} articles")
            for article in articles:
                print(f"  {article['id']}. {article['title'][:60]}...")
        else:
            print(f"[Claude] ⚠️ Parsed 0 articles from response")
            return [], "No articles found. Claude may not have used web search. Try again."
        
        return articles, None
        
    except Exception as e:
        print(f"[Claude] ✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return [], f"Claude error: {str(e)}"

# ============================================================================
# CONTENT CLEANUP
# ============================================================================

def clean_blog_content(content, blog_title):
    """Remove unwanted text like 'Full URL' and clean up content"""
    
    # Remove "Full URL:" and similar patterns
    patterns_to_remove = [
        r'Full URL:\s*',
        r'Full url:\s*',
        r'FULL URL:\s*',
        r'Source URL:\s*',
        r'Article URL:\s*',
        r'Read more:\s*https?://[^\s<]+',
        r'Original article:\s*https?://[^\s<]+',
        r'\[Full URL\]\s*',
        r'\[Source\]\s*',
    ]
    
    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)
    
    # Remove standalone URLs that aren't in anchor tags
    # (but keep URLs that are already in <a> tags)
    content = re.sub(r'(?<!href=")(?<!src=")(https?://[^\s<>"]+)(?![^<]*</a>)', '', content)
    
    # Clean up multiple newlines
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    
    # Remove any references to source URLs in text
    content = re.sub(r'You can read (?:the full article|more) at:?\s*', '', content, flags=re.IGNORECASE)
    content = re.sub(r'Source:?\s*', '', content, flags=re.IGNORECASE)
    
    return content.strip()

# ============================================================================
# GENERATION - GEMINI
# ============================================================================

def generate_blog_with_gemini(api_key, news_item, temperature, max_tokens, writer, links):
    """Generate blog with Gemini"""
    try:
        import google.generativeai as genai
        
        print(f"[Gemini Blog {news_item['id']}] Generating as {writer['name']}...")
        genai.configure(api_key=api_key)
        
        cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['clickbank'])])
        amz_text = "\n".join([f"[AMZ{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['amazon'])])
        
        prompt = f"""You are {writer['name']}, {writer['title']} at KnotStranded.
STYLE: {writer.get('style', 'Expert')} | VOICE: {writer.get('voice', 'Professional')}

SEO INSTRUCTIONS: 
1. Research high-volume keywords related to the topic.
2. Use a Provocative, SEO-optimized title.
3. Use semantic H2 and H3 tags.
4. Include a 150-word summary at the start (Meta info).
5. Weave in affiliate links naturally within high-value paragraphs.

Write a 1500-word deep-dive research article based on: "{news_item['title']}"
Snippet: {news_item['snippet']}

MONETIZATION (Mention naturally 3 of each):
CLICKBANK:
{cb_text}

AMAZON:
{amz_text}

Format:
TITLE: [Provocative Title]
CONTENT: [1500 words of research and opinion. Naturally weave in [CB1], [CB2], [CB3] and [AMZ1], [AMZ2], [AMZ3]. Use headings and lists.]"""
        
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        config = genai.GenerationConfig(temperature=float(temperature), max_output_tokens=4000)
        response = model.generate_content(prompt, generation_config=config)
        
        # Parsing logic same as before but with more placeholders
        title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', response.text, re.IGNORECASE)
        content_match = re.search(r'CONTENT:\s*(.+)', response.text, re.IGNORECASE | re.DOTALL)
        
        title = title_match.group(1).strip() if title_match else news_item['title']
        content = content_match.group(1).strip() if content_match else response.text
        
        for i, link in enumerate(links['clickbank']):
            content = content.replace(f"[CB{i+1}]", f'<a href="{link["url"]}" class="affiliate-link cb-link">{link["title"]}</a>')
        for i, link in enumerate(links['amazon']):
            content = content.replace(f"[AMZ{i+1}]", f'<a href="{link["url"]}" class="affiliate-link amz-link">{link["title"]}</a>')
            
        print(f"[Gemini Blog {news_item['id']}] ✓ Generated by {writer['name']}")

        return {
            'title': title,
            'content': clean_blog_content(content, title),
            'writer': writer,
            'category': news_item.get('category', 'entertainment'),
            'affiliate_links': links # Keep original links structure for consistency
        }
    except Exception as e:
        print(f"[Gemini Blog {news_item['id']}] ✗ Error: {str(e)}")
        raise

# ============================================================================
# GENERATION - CLAUDE
# ============================================================================

def generate_blog_with_claude(api_key, news_item, temperature, max_tokens, writer, links):
    """Generate blog with Claude"""
    try:
        print(f"[Claude Blog {news_item['id']}] Generating as {writer['name']}...")
        client = anthropic.Anthropic(api_key=api_key)
        
        cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['clickbank'])])
        amz_text = "\n".join([f"[AMZ{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['amazon'])])
        
        prompt = f"""You are {writer['name']}, {writer['title']} at KnotStranded.
SEO TASK:
1. Target keywords: {news_item['title']} and related trending terms.
2. Structure with H2/H3 for readability and indexing.
3. Write a 1500-word authoritative opinion and research piece.
4. Naturally weave in affiliate links.

Topic: {news_item['title']}
Snippet: {news_item['snippet']}

AFFILIATE PRODUCTS (Insert naturally - 3 of each):
CLICKBANK: {cb_text}
AMAZON: {amz_text}

FORMAT:
TITLE: [Headline]
CONTENT: [1500 words. Weave in [CB1..3] and [AMZ1..3]. Use semantic HTML tags for structure.]"""
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=4000,
            temperature=float(temperature),
            messages=[{"role": "user", "content": prompt}]
        )
        rt = message.content[0].text
        title = re.search(r'TITLE:\s*(.+?)(?:\n|$)', rt, re.I).group(1).strip() if re.search(r'TITLE:\s*(.+?)(?:\n|$)', rt, re.I) else news_item['title']
        content = re.search(r'CONTENT:\s*(.+)', rt, re.I | re.S).group(1).strip() if re.search(r'CONTENT:\s*(.+)', rt, re.I | re.S) else rt
        
        for i, link in enumerate(links['clickbank']):
            content = content.replace(f"[CB{i+1}]", f'<a href="{link["url"]}" class="affiliate-link cb-link">{link["title"]}</a>')
        for i, link in enumerate(links['amazon']):
            content = content.replace(f"[AMZ{i+1}]", f'<a href="{link["url"]}" class="affiliate-link amz-link">{link["title"]}</a>')
            
        print(f"[Claude Blog {news_item['id']}] ✓ Generated by {writer['name']}")

        return {
            'title': title,
            'content': clean_blog_content(content, title),
            'writer': writer,
            'category': news_item.get('category', 'entertainment'),
            'affiliate_links': links # Keep original links structure for consistency
        }
    except Exception as e:
        print(f"[Claude Blog {news_item['id']}] ✗ Error: {str(e)}")
        raise

# ============================================================================
# GENERATION - CHATGPT
# ============================================================================

def generate_blog_with_chatgpt(api_key, news_item, temperature, max_tokens, writer, clickbank_links):
    """Generate blog with ChatGPT"""
    try:
        import openai
        
        print(f"[ChatGPT Blog {news_item['id']}] Generating as {writer['name']}...")
        openai.api_key = api_key
        
        links_text = "\n".join([f"[LINK{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(clickbank_links)])
        
        prompt = f"""You are {writer['name']}, {writer['title']} at KnotStranded.

STYLE: {writer.get('style', 'Engaging')}

News: {news_item['title']}
{news_item['snippet']}

LINKS (mention naturally):
{links_text}

Format:
TITLE: [Title]
CONTENT: [500-700 words with 3 links: "For readers, [LINK1]..." Be opinionated.]"""
        
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"You are {writer['name']}."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=int(max_tokens),
            temperature=float(temperature)
        )
        
        response_text = response.choices[0].message.content
        title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', response_text, re.IGNORECASE)
        content_match = re.search(r'CONTENT:\s*(.+)', response_text, re.IGNORECASE | re.DOTALL)
        
        title = title_match.group(1).strip() if title_match and content_match else news_item['title']
        content = content_match.group(1).strip() if title_match and content_match else response.text
        
        for i, link in enumerate(clickbank_links):
            content = content.replace(f"[LINK{i+1}]", f'<a href="{link["url"]}" target="_blank" rel="nofollow sponsored">{link["title"]}</a>')
        
        # Clean up content (remove "Full URL" and unwanted text)
        content = clean_blog_content(content, title)
        
        print(f"[ChatGPT Blog {news_item['id']}] ✓ Generated by {writer['name']}")
        
        return {
            'title': title,
            'content': content,
            'writer': writer,
            'category': news_item.get('category', 'entertainment'),
            'affiliate_links': clickbank_links
        }
    except Exception as e:
        print(f"[ChatGPT Blog {news_item['id']}] ✗ Error: {str(e)}")
        raise

# ============================================================================
# IMAGE GENERATION
# ============================================================================

def generate_featured_image(api_key, title, blog_id):
    """Generate image with DALL-E"""
    try:
        import openai
        
        print(f"[Image {blog_id}] Generating...")
        openai.api_key = api_key
        
        prompt = f"Professional editorial illustration for entertainment blog: '{title}'. Cinematic, elegant style. No text."
        
        response = openai.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1792x1024",
            quality="standard",
            n=1
        )
        
        # Download image
        img_url = response.data[0].url
        img_data = requests.get(img_url, timeout=30)
        
        if img_data.status_code == 200:
            os.makedirs('generated_posts', exist_ok=True)
            filename = f"featured_{blog_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            filepath = os.path.join('generated_posts', filename)
            
            with open(filepath, 'wb') as f:
                f.write(img_data.content)
            
            print(f"[Image {blog_id}] ✓ Saved")
            return filepath
        
        return None
# ============================================================================
# HTML GENERATION
# ============================================================================

def create_styled_html(blog_data, news_metadata, provider_name, featured_image=None):
    """Create a premium styled HTML page for the blog post"""
    title = blog_data['title']
    content = blog_data['content']
    writer = blog_data['writer']
    
    writer_name = writer['name']
    writer_title = writer['title']
    
    # Convert markdown-style content to HTML if needed
    formatted_content = content
    if "<p>" not in content:
        # Simple markdown to HTML
        paragraphs = content.split('\n\n')
        formatted_content = "".join([f"<p>{p.strip()}</p>" for p in paragraphs if p.strip()])
    
    # Ensure headings are styled
    formatted_content = re.sub(r'<h2>(.*?)</h2>', r'<h2 class="section-title">\1</h2>', formatted_content)
    formatted_content = re.sub(r'### (.*?)(\n|$)', r'<h3>\1</h3>', formatted_content)
    
    img_html = f'<div class="featured-image-wrapper"><img src="{featured_image}" class="featured-image" alt="{title}"></div>' if featured_image else ''

    base_url = request.host_url.rstrip('/')
    meta_description = re.sub(r'<.*?>', '', formatted_content)[:160].replace('"', "'")
    post_slug = title.lower().replace(' ', '-')
    canonical_url = f"{base_url}/post/{post_slug}.html"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | KnotStranded Intelligence</title>
    <meta name="description" content="{meta_description}">
    <meta name="keywords" content="{', '.join(NEWS_CATEGORIES.get(blog_data.get('category', 'entertainment'), {}).get('tags', []))}">
    <link rel="canonical" href="{canonical_url}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{meta_description}">
    {f'<meta property="og:image" content="{base_url}/{featured_image}">' if featured_image else ''}

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="{title}">
    <meta property="twitter:description" content="{meta_description}">
    
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --brand: #4f46e5;
            --hot: #ff4500;
            --text: #0f172a;
            --bg: #ffffff;
            --subtle: #f8fafc;
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            line-height: 1.8; 
            color: var(--text); 
            background: var(--bg);
            padding-bottom: 100px;
        }}
        .container {{ max-width: 800px; margin: 0 auto; padding: 40px 20px; }}
        
        .header-meta {{ margin-bottom: 40px; text-align: center; }}
        .badge-row {{ display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }}
        .badge {{ 
            font-size: 10px; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 0.1em; 
            padding: 6px 14px; 
            border-radius: 50px; 
            color: white;
        }}
        .badge-hot {{ background: linear-gradient(90deg, #ff4500 0%, #ff8c00 100%); }}
        .badge-intel {{ background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%); }}
        
        h1 {{ 
            font-family: 'Playfair Display', serif; 
            font-size: 3.5rem; 
            font-weight: 900; 
            line-height: 1.1; 
            margin-bottom: 24px;
            font-style: italic;
        }}
        .meta-line {{ 
            font-size: 12px; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 0.15em; 
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
        }}
        
        .featured-image-wrapper {{ 
            margin: 40px 0; 
            border-radius: 32px; 
            overflow: hidden; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }}
        .featured-image {{ width: 100%; height: auto; display: block; }}
        
        .content {{ font-size: 1.25rem; font-weight: 400; }}
        .content p {{ margin-bottom: 32px; }}
        .content h2 {{ 
            font-family: 'Playfair Display', serif; 
            font-size: 2.2rem; 
            margin: 60px 0 24px; 
            font-style: italic;
            border-left: 4px solid var(--brand);
            padding-left: 20px;
        }}
        .content h3 {{ font-size: 1.5rem; margin: 40px 0 20px; color: var(--brand); }}
        
        .affiliate-link {{ 
            font-weight: 800; 
            color: var(--brand); 
            text-decoration: none; 
            border-bottom: 2px solid rgba(79, 70, 229, 0.2); 
            padding: 0 4px;
            transition: all 0.2s;
        }}
        .affiliate-link:hover {{ background: var(--brand); color: white; border-radius: 4px; }}
        .cb-link::after {{ content: ' [Intelligence Tool]'; font-size: 0.6rem; opacity: 0.6; }}
        .amz-link::after {{ content: ' [Expert Choice]'; font-size: 0.6rem; opacity: 0.6; }}
        
        .footer {{ 
            margin-top: 80px; 
            padding-top: 40px; 
            border-top: 2px solid #000;
            text-align: center;
        }}
        .footer-logo {{ font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 900; font-style: italic; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header-meta">
            <div class="badge-row">
                <span class="badge badge-hot">Viral Intelligence</span>
                <span class="badge badge-intel">1500w Deep Dive</span>
            </div>
            <h1>{title}</h1>
            <div class="meta-line">
                By {writer_name} • {writer_title} • {datetime.now().strftime('%B %d, %Y')}
            </div>
        </div>

        {img_html}

        <div class="content">
            {formatted_content}
        </div>

        <div class="footer">
            <div class="footer-logo">KnotStranded</div>
            <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 10px; color: #64748b;">
                &copy; 2026 Viral Media Intelligence Group
            </p>
        </div>
    </div>
</body>
</html>"""
    return html

# ============================================================================
# RETRY LOGIC
# ============================================================================

def search_with_retry(config, max_retries=2):
    """Search with retry"""
    provider = config.get('ai_provider', 'claude')
    num = int(config.get('num_articles', 5))
    query = config.get('query_filter', '')
    cats = config.get('selected_categories', ['movies', 'tv'])
    
    for attempt in range(max_retries):
        try:
            if provider == 'gemini':
                return search_with_gemini(config['gemini_api_key'], num, query, cats)
            else:
                return search_with_claude(config['anthropic_api_key'], num, query, cats)
        except:
            if attempt < max_retries - 1:
                time.sleep(5)
    return [], "Search failed"

def generate_blog_with_retry(config, news_item, writer, clickbank_links, max_retries=3):
    """Generate with retry"""
    provider = config.get('ai_provider', 'claude')
    
    for attempt in range(max_retries):
        try:
            if provider == 'chatgpt':
                return generate_blog_with_chatgpt(config['openai_api_key'], news_item, config['temperature'], config['max_tokens'], writer, clickbank_links)
            elif provider == 'gemini':
                return generate_blog_with_gemini(config['gemini_api_key'], news_item, config['temperature'], config['max_tokens'], writer, clickbank_links)
            else:
                return generate_blog_with_claude(config['anthropic_api_key'], news_item, config['temperature'], config['max_tokens'], writer, clickbank_links)
        except anthropic.RateLimitError:
            if attempt < max_retries - 1:
                time.sleep((attempt + 1) * 20)
            else:
                raise Exception("Rate limit")
        except:
            if attempt < max_retries - 1:
                time.sleep(5)
            else:
                raise

# ============================================================================
# GENERATION WORKER
# ============================================================================

generation_state = {
    'status': 'idle',
    'progress': 0,
    'total': 0,
    'current_article': '',
    'news_items': [],
    'generated_files': [],
    'error': None,
    'ai_used': None
}

def generation_worker(config, selected_ids):
    """Background generation"""
    global generation_state
    
    try:
        items = [item for item in generation_state['news_items'] if item['id'] in selected_ids]
        if not items:
            generation_state['status'] = 'error'
            generation_state['error'] = "No articles selected"
            return
        
        provider = config.get('ai_provider', 'claude')
        print(f"\n{'='*60}")
        print(f"GENERATING {len(items)} BLOGS WITH {provider.upper()}")
        print(f"{'='*60}")
        
        generation_state['status'] = 'generating'
        generation_state['total'] = len(items)
        generation_state['ai_used'] = provider.title()
        
        os.makedirs('generated_posts', exist_ok=True)
        
        for i, news_item in enumerate(items, 1):
            generation_state['progress'] = i
            generation_state['current_article'] = news_item['title']
            
            print(f"\n[{i}/{len(items)}] {news_item['title'][:50]}...")
            
            writer = select_random_writer()
            print(f"[{i}/{len(items)}] Writer: {writer['name']}")
            
            category = news_item.get('category', 'entertainment')
            clickbank_links = get_clickbank_links(category, 3)
            
            try:
                links = get_affiliate_links(category)
                blog_result = generate_blog_with_retry(config, news_item, writer, links)
                
                featured_image = None
                if config.get('openai_api_key'):
                    featured_image = generate_featured_image(config['openai_api_key'], blog_result['title'], news_item['id'])
                
                html = create_styled_html(blog_result, news_item, provider.title(), featured_image)
                tags = generate_tags(category)
                
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"blog_{news_item['id']}_{timestamp}.html"
                filepath = os.path.join('generated_posts', filename)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(html)
                
                generation_state['generated_files'].append({
                    'filename': filename,
                    'title': blog_result['title'],
                    'filepath': filepath,
                    'writer': writer['name'],
                    'category': category,
                    'tags': tags,
                    'html_content': html,
                    'featured_image': featured_image
                })
                
                print(f"[{i}/{len(items)}] ✓ Saved by {writer['name']}")
                
                if i < len(items):
                    time.sleep(2)
                    
            except Exception as e:
                print(f"[{i}/{len(items)}] ✗ Error: {str(e)}")
                if 'rate' in str(e).lower():
                    generation_state['status'] = 'error'
                    generation_state['error'] = "Rate limit. Wait 60s."
                    return
        
        generation_state['status'] = 'complete'
        print(f"\n{'='*60}")
        print(f"✓ COMPLETED {len(generation_state['generated_files'])} BLOGS!")
        print(f"{'='*60}\n")
        
    except Exception as e:
        generation_state['status'] = 'error'
        generation_state['error'] = str(e)
        print(f"\n✗ Error: {str(e)}\n")

# ============================================================================
# FLASK ROUTES
# ============================================================================

@app.route('/')
def home():
    """Serve a clean blog index as a portal"""
    posts_by_category = {cat: [] for cat in NEWS_CATEGORIES.keys()}
    latest_posts = []
    
    if os.path.exists('generated_posts'):
        filenames = sorted(os.listdir('generated_posts'), key=lambda x: os.path.getmtime(os.path.join('generated_posts', x)), reverse=True)
        
        for filename in filenames:
            if filename.endswith('.html'):
                filepath = os.path.join('generated_posts', filename)
                try:
                    with open(filepath, 'r') as f:
                        content = f.read()
                        title = re.search(r'<h1>(.*?)</h1>', content).group(1) if re.search(r'<h1>(.*?)</h1>', content) else filename
                        date = re.search(r'<div class="meta">(.*?) •', content).group(1) if re.search(r'<div class="meta">(.*?) •', content) else "Recent"
                        
                        # Extract featured image
                        img_match = re.search(r'src="(static/img/.*?)"', content)
                        img = img_match.group(1) if img_match else None
                        
                        # Find category (stored in generation log or inferred)
                        # For now, let's try to infer from filename if possible or default
                        cat = "movies" # default
                        for c in NEWS_CATEGORIES.keys():
                            if c in filename.lower():
                                cat = c
                                break
                        
                        post_data = {
                            'filename': filename,
                            'title': title,
                            'date': date,
                            'img': img,
                            'category': cat,
                            'category_name': NEWS_CATEGORIES[cat]['name']
                        }
                        
                        if len(latest_posts) < 6:
                            latest_posts.append(post_data)
                        
                        if len(posts_by_category[cat]) < 5:
                            posts_by_category[cat].append(post_data)
                except:
                    continue
    
    return render_template('landing.html', 
                          latest_posts=latest_posts, 
                          categories=posts_by_category, 
                          tips=DAILY_TIPS,
                          cat_info=NEWS_CATEGORIES)

@app.route('/blog_generator_hero.png')
def send_hero():
    return send_from_directory('.', 'blog_generator_hero.png')

@app.route('/blog')
def admin_dashboard():
    return send_from_directory('webapp/dist', 'index.html')

@app.route('/assets/<path:path>')
def send_assets(path):
    return send_from_directory('webapp/dist/assets', path)

@app.route('/vite.svg')
def send_vite_svg():
    return send_from_directory('webapp/dist', 'vite.svg')

@app.route('/post/<filename>')
def view_post(filename):
    """View a specific post"""
    return send_from_directory('generated_posts', filename)

@app.route('/robots.txt')
def robots():
    return """User-agent: *
Allow: /
Sitemap: http://localhost:5000/sitemap.xml
""", 200, {'Content-Type': 'text/plain'}

@app.route('/sitemap.xml')
def sitemap():
    pages = []
    base_url = request.host_url.rstrip('/')
    # Dynamic pages
    pages.append({'loc': f'{base_url}/', 'lastmod': datetime.now().strftime('%Y-%m-%d')})
    
    if os.path.exists('generated_posts'):
        for filename in os.listdir('generated_posts'):
            if filename.endswith('.html'):
                filepath = os.path.join('generated_posts', filename)
                mtime = datetime.fromtimestamp(os.path.getmtime(filepath)).strftime('%Y-%m-%d')
                pages.append({'loc': f'{base_url}/post/{filename}', 'lastmod': mtime})
    
    sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for page in pages:
        sitemap_xml += f"  <url>\n    <loc>{page['loc']}</loc>\n    <lastmod>{page['lastmod']}</lastmod>\n    <changefreq>daily</changefreq>\n  </url>\n"
    sitemap_xml += '</urlset>'
    
    return sitemap_xml, 200, {'Content-Type': 'application/xml'}
def get_config():
    config = load_config()
    # Add geolocation hints if not present
    loc = get_location_from_ip()
    config['detected_location'] = loc['description']
    config['postal_hint'] = loc['postal']
    return jsonify(config)

@app.route('/api/config', methods=['POST'])
def save_config_route():
    return jsonify({'success': save_config(request.json)})

@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify({'categories': [{"id": k, "name": v["name"]} for k, v in NEWS_CATEGORIES.items()]})

@app.route('/api/clickbank-products', methods=['GET'])
def get_clickbank_products():
    """Get ClickBank products organized by category"""
    products_by_category = {}
    
    for category_id, category_data in NEWS_CATEGORIES.items():
        products = CLICKBANK_PRODUCTS.get(category_id, CLICKBANK_PRODUCTS.get("default", []))
        
        # Check if products are placeholders
        products_with_status = []
        for product in products:
            is_placeholder = "YOURVENDOR" in product["url"] or "YOURID" in product["url"]
            products_with_status.append({
                "title": product["title"],
                "description": product["description"],
                "url": product["url"],
                "is_placeholder": is_placeholder
            })
        
        products_by_category[category_id] = {
            "category_name": category_data["name"],
            "products": products_with_status
        }
    
    return jsonify(products_by_category)

@app.route('/api/search', methods=['POST'])
def search():
    config = request.json
    save_config(config)
    
    generation_state['news_items'] = []
    generation_state['generated_files'] = []
    
    articles, error = search_with_retry(config)
    
    if error:
        return jsonify({'error': error}), 400
    
    generation_state['news_items'] = articles
    return jsonify({'news_items': articles, 'ai_used': config.get('ai_provider', 'claude').title()})

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.json
    save_config(data['config'])
    
    generation_state['status'] = 'idle'
    generation_state['progress'] = 0
    generation_state['error'] = None
    generation_state['generated_files'] = []
    
    thread = threading.Thread(target=generation_worker, args=(data['config'], data['selected_ids']))
    thread.daemon = True
    thread.start()
    
    return jsonify({'status': 'started'})

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify(generation_state)

@app.route('/api/download/<filename>')
def download(filename):
    filepath = os.path.join('generated_posts', filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/view/<filename>')
def view(filename):
    filepath = os.path.join('generated_posts', filename)
    if os.path.exists(filepath):
        return send_file(filepath)
    return jsonify({'error': 'Not found'}), 404


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("\n" + "="*70)
    print(" KNOTSTRANDED BLOG GENERATOR - PRODUCTION READY")
    print("="*70)
    print(f"\n🌐 Server: http://0.0.0.0:{port}")
    print("="*70 + "\n")
    
    app.run(debug=False, host='0.0.0.0', port=port)
