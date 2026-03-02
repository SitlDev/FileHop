#!/usr/bin/env python3
"""
KnotStranded Media Blog Generator - Complete Ultimate Edition
Categories + ChatGPT + Images + ClickBank + Squarespace Posting
"""

from flask import Flask, render_template, request, jsonify, send_file, send_from_directory, session, redirect, url_for
from functools import wraps
import os
import json
from datetime import datetime, timedelta
import anthropic
import concurrent.futures
import threading
import signal
import re
import time
import random
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'knotstranded-secret-key-9988')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '!H14Sua12')
# Set API_SECRET_KEY in your Railway environment variables to enable remote curl access.
# e.g. API_SECRET_KEY=some-long-random-string
API_SECRET_KEY = os.environ.get('API_SECRET_KEY', '')

# ── Persistent data directory ──────────────────────────────────────────────────
# On Railway: set DATA_DIR=/data and mount a Volume at /data.
# Locally:    leave unset — defaults to the current working directory.
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get('DATA_DIR', PROJECT_ROOT)
os.makedirs(DATA_DIR, exist_ok=True)

POSTS_DIR           = os.path.join(DATA_DIR, 'knot_storage')
CONFIG_FILE         = os.path.join(DATA_DIR, 'blog_settings.json')
SUBSCRIBERS_FILE    = os.path.join(DATA_DIR, 'subscribers.json')
LANDING_INDEX_FILE  = os.path.join(DATA_DIR, 'landing_index.json')
PENDING_POSTS_FILE  = os.path.join(DATA_DIR, 'pending_posts.json')
GENERATED_IMG_DIR   = os.path.join(DATA_DIR, 'knot_images')
STATIC_SITE_DIR     = os.path.join(DATA_DIR, 'static_site')

# Ensure core directories exist on first boot
for _d in [POSTS_DIR, GENERATED_IMG_DIR, STATIC_SITE_DIR]:
    os.makedirs(_d, exist_ok=True)


@app.route('/robots.txt')
def robots_txt():
    """Build a search-engine friendly robots.txt"""
    content = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /dashboard",
        "Disallow: /api/",
        "Disallow: /login",
        f"Sitemap: {request.host_url.rstrip('/')}/sitemap.xml"
    ]
    return "\n".join(content), 200, {'Content-Type': 'text/plain'}

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
        "keywords": ["local news", "community", "city council", "regional", "hometown", "church", "business news", "programs", "city events"],
        "tags": ["local", "community", "regional", "hometown", "local news"]
    },
    "tech": {
        "name": "Tech & AI",
        "keywords": ["artificial intelligence", "gadgets", "software", "tech news", "innovation", "silicon valley"],
        "tags": ["technology", "ai", "gadgets", "future", "software"]
    },
    "finance": {
        "name": "Finance & Business",
        "keywords": ["stocks", "crypto", "economy", "entrepreneurship", "markets", "investing"],
        "tags": ["finance", "business", "investing", "crypto", "stocks"]
    },
    "health": {
        "name": "Health & Wellness",
        "keywords": ["fitness", "mental health", "nutrition", "biohacking", "wellness", "medical"],
        "tags": ["health", "wellness", "fitness", "lifestyle", "mental health"]
    },
    "lifestyle": {
        "name": "Lifestyle & Travel",
        "keywords": ["travel", "home decor", "food", "fashion", "luxury", "diy"],
        "tags": ["lifestyle", "travel", "food", "fashion", "home"]
    },
    "science": {
        "name": "Science & Nature",
        "keywords": ["space", "environment", "discoveries", "biology", "physics", "climate"],
        "tags": ["science", "space", "nature", "environment", "discovery"]
    },
    "sports": {
        "name": "Sports World",
        "keywords": ["nba", "nfl", "soccer", "mlb", "olympics", "racing"],
        "tags": ["sports", "athletes", "games", "competition", "teams"]
    },
    "politics": {
        "name": "Global Politics",
        "keywords": ["politics", "election", "government", "policy", "senate", "white house", "congress"],
        "tags": ["politics", "government", "elections", "policy", "world news"]
    },
    "us_politics": {
        "name": "US Politics",
        "keywords": ["congress", "senate", "washington", "supreme court", "domestic policy", "legislation", "federal"],
        "tags": ["us politics", "washington", "legislation", "government"]
    }
}

@app.route('/generated/<path:filename>')
def serve_generated(filename):
    """Serve files from knot_images directory"""
    return send_from_directory(GENERATED_IMG_DIR, filename)

@app.route('/avatars/<path:filename>')
def serve_avatars(filename):
    """Serve the generated writer profile avatars"""
    return send_from_directory('knot_images/avatars', filename)

# ============================================================================
# CLICKBANK PRODUCTS
# ============================================================================
# IMPORTANT: Replace these URLs with your actual ClickBank affiliate links!
# Format: https://[vendor].vendor.hop.clickbank.net/?affiliate=[YOUR_AFFILIATE_ID]


AFFILIATE_LIBRARY_FILE = os.path.join(DATA_DIR, 'affiliate_library.json')

def load_affiliate_library():
    if os.path.exists(AFFILIATE_LIBRARY_FILE):
        with open(AFFILIATE_LIBRARY_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_affiliate_library(data):
    with open(AFFILIATE_LIBRARY_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# Global proxy for easier refactoring
def _get_lib():
    return load_affiliate_library()

def get_cj_products(): return _get_lib().get('CJ_PRODUCTS', {})
def get_digistore_products(): return _get_lib().get('DIGISTORE_PRODUCTS', {})
def get_impact_products(): return _get_lib().get('IMPACT_PRODUCTS', {})
def get_clickbank_products_lib(): return _get_lib().get('CLICKBANK_PRODUCTS', {})
def get_subscription_offers(): return _get_lib().get('SUBSCRIPTION_OFFERS', {})
def get_amazon_products(): return _get_lib().get('AMAZON_PRODUCTS', {})
# ============================================================================
# AUTHENTICATION
# ============================================================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow API key as an alternative to session auth (for remote curl access)
        api_key_header = request.headers.get('X-Api-Key', '')
        if API_SECRET_KEY and api_key_header == API_SECRET_KEY:
            return f(*args, **kwargs)
        if not session.get('logged_in'):
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized'}), 401
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form['password'] == ADMIN_PASSWORD:
            session['logged_in'] = True
            next_url = request.args.get('next') or url_for('dashboard_portal')
            return redirect(next_url)
        else:
            error = 'Invalid password. Please try again.'
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/api/affiliate/library', methods=['GET'])
@login_required
def get_affiliate_library_api():
    return jsonify(load_affiliate_library())

@app.route('/api/affiliate/library', methods=['POST'])
@login_required
def update_affiliate_library_api():
    data = request.json
    
    # Auto-fix placeholders based on description hint (e.g. "Vendor: MYID")
    if 'CLICKBANK_PRODUCTS' in data:
        for cat, products in data['CLICKBANK_PRODUCTS'].items():
            for p in products:
                if 'url' in p and 'YOURVENDOR' in p['url']:
                    desc = p.get('description', '')
                    # Look for pattern like "Vendor: ABC" or "[ABC]"
                    match = re.search(r'(?:Vendor:\s*|ID:\s*|\[)([A-Za-z0-9_-]{3,})', desc, re.I)
                    if match:
                        v_id = match.group(1).lower()
                        p['url'] = p['url'].replace('YOURVENDOR', v_id)
                        
    save_affiliate_library(data)
    return jsonify({'status': 'success'})

@app.route('/api/affiliate/update-placeholder', methods=['POST'])
@login_required
def update_affiliate_placeholder():
    """Automatically updates YOURVENDOR placeholders if a vendor ID is found in mapping or provided."""
    data = request.json
    title = data.get('title')
    vendor_id = data.get('vendor_id')
    
    lib = load_affiliate_library()
    updated = False
    
    # Simple search and replace in ClickBank products
    if 'CLICKBANK_PRODUCTS' in lib:
        for cat, products in lib['CLICKBANK_PRODUCTS'].items():
            for p in products:
                if p['title'] == title:
                    p['url'] = p['url'].replace('YOURVENDOR', vendor_id)
                    updated = True
    
    if updated:
        save_affiliate_library(lib)
        return jsonify({'status': 'success'})
    return jsonify({'status': 'not_found'}), 404

def generate_clickbank_todo_list():
    """Generates a daily Markdown to-do list of Clickbank products the user needs to sign up for."""
    import json
    import urllib.parse
    
    vendor_mapping = {}
    try:
        if os.path.exists("vendor_mapping.json"):
            with open("vendor_mapping.json", "r") as f:
                vendor_mapping = json.load(f)
    except Exception:
        pass
        
    missing_items = []
    
    # Iterate through all configured ClickBank products
    for category, products in get_clickbank_products_lib().items():
        for product in products:
            title = product['title']
            mapped_vendor = vendor_mapping.get(title)
            
            # If there's no mapping or it's still missing/default, it needs a signup!
            if not mapped_vendor or mapped_vendor == "YOURVENDOR":
                search_url = f"https://accounts.clickbank.com/marketplace.htm?search={urllib.parse.quote_plus(title)}"
                missing_items.append(f"- **{category.title()}**: {title}  \n  (Search ClickBank: [Find Vendor Here]({search_url}))\n")
                
    # Save the To-Do list
    try:
        with open("CLICKBANK_TODO.md", "w") as f:
            f.write("# Daily ClickBank Sign-up Checklist\n\n")
            f.write("In order to get paid for these affiliate links, you need to find relevant vendors on ClickBank and map them to these titles.\n\n")
            f.write("### Instructions:\n")
            f.write("1. Click the 'Find Vendor Here' link to search ClickBank.\n")
            f.write("2. Once you find a product you like, find their vendor ID.\n")
            f.write("3. Open `vendor_mapping.json` and add the mapping: `\"Product Title\": \"vendor_id\"`.\n\n")
            
            if missing_items:
                f.write("### You need to sign up for these vendors:\n")
                for item in missing_items:
                    f.write(item)
            else:
                f.write("✅ **You are fully configured! All placeholder vendors have been mapped.**\n")
    except Exception as e:
        print("Failed to write ClickBank ToDo list:", e)

def get_affiliate_links(category, num_cb=6, num_amz=6, num_sub=4, context=None):
    """
    Get ClickBank, Amazon, and Subscription links for category.
    Returns a LARGER POOL so the AI can decide on placement based on article context.
    """
    import urllib.parse
    import re
    import json
    
    config = load_config()
    amazon_tag = config.get('amazon_tag', 'knotstranded-20')
    clickbank_id = config.get('clickbank_affiliate_id', 'l4j4n')
    
    raw_cb_products = get_clickbank_products_lib().get(category, get_clickbank_products_lib().get("default", []))
    raw_amz_products = get_amazon_products().get(category, get_amazon_products().get("default", []))
    
    # Load user's mapped vendors (Support both JSON and a simple .txt list)
    vendor_mapping = {}
    
    # 1. Try simple text format first (easier for user)
    if os.path.exists("vendor_mapping.txt"):
        try:
            with open("vendor_mapping.txt", "r") as f:
                for line in f:
                    if ":" in line:
                        # Handle formats like "1. Product Title: vendor_id" or "Product Title: vendor_id"
                        parts = line.strip().split(":", 1)
                        title_part = parts[0].strip()
                        # Strip leading "1. " or "2) " if present
                        title_part = re.sub(r'^\d+[\.\)]\s*', '', title_part)
                        vendor_id = parts[1].strip()
                        vendor_mapping[title_part] = vendor_id
        except Exception as e:
            print(f"Error parsing vendor_mapping.txt: {e}")

    # 2. Try JSON (legacy support)
    if not vendor_mapping and os.path.exists("vendor_mapping.json"):
        try:
            with open("vendor_mapping.json", "r") as f:
                vendor_mapping = json.load(f)
        except Exception:
            pass
    
    # Dynamically inject the user's actual Clickbank ID and mapped Vendor ID into the URL
    cb_products = []
    for product in raw_cb_products:
        vendor_id = vendor_mapping.get(product['title'], "YOURVENDOR")
        
        # Smart vendor detection from description if still placeholder
        if vendor_id == "YOURVENDOR":
            desc_lower = product.get('description', '').lower()
            # Major ClickBank products with reliable high conversion
            if 'ted\'s woodworking' in desc_lower or 'woodworking' in desc_lower: vendor_id = "tedswood"
            elif 'manifestation' in desc_lower: vendor_id = "manifest"
            elif 'keto' in desc_lower or 'ketogenic' in desc_lower: vendor_id = "ketoplan"
            elif 'diabetes' in desc_lower: vendor_id = "diabfree"
            elif 'streaming' in desc_lower or 'tv guide' in desc_lower: vendor_id = "streamtv"
            elif 'crypto' in desc_lower or 'bitcoin' in desc_lower: vendor_id = "cryptoguide"
            elif 'writing' in desc_lower or 'article' in desc_lower: vendor_id = "writejobs"
            elif 'dentitox' in desc_lower or 'dental' in desc_lower: vendor_id = "dentitox"
            elif 'exipure' in desc_lower or 'weight loss' in desc_lower: vendor_id = "exipure"
            elif 'ikaria' in desc_lower or 'juice' in desc_lower: vendor_id = "ikaria"
            elif 'prostadine' in desc_lower or 'prostate' in desc_lower: vendor_id = "prostadine"
            elif 'liv pure' in desc_lower or 'liver' in desc_lower: vendor_id = "livpure"
            elif 'alpilean' in desc_lower or 'alpine' in desc_lower: vendor_id = "alpilean"
            elif 'gluptrust' in desc_lower or 'blood sugar' in desc_lower: vendor_id = "gluco"
            elif 'java burn' in desc_lower or 'coffee' in desc_lower: vendor_id = "javaburn"
            elif 'tea burn' in desc_lower: vendor_id = "teaburn"

        # If it's still YOURVENDOR after mapping and smart detection, skip it
        if vendor_id == "YOURVENDOR":
            continue
            
        # replace any affiliate=xyz with the one from config
        functional_url = re.sub(r'affiliate=[\w\d]+', f'affiliate={clickbank_id}', product['url'])
        functional_url = functional_url.replace("YOURVENDOR", vendor_id)
        
        cb_products.append({
            "title": product['title'],
            "url": functional_url,
            "description": product['description'],
            "image": product.get("image")
        })
    
    # Dynamically convert placeholder Amazon links to actual search results
    amz_products = []
    for product in raw_amz_products:
        query = urllib.parse.quote_plus(product['title'])
        # Use gp/search portal for better reliability and avoiding 404s on direct /s query paths
        functional_url = f"https://www.amazon.com/gp/search?ie=UTF8&tag={amazon_tag}&keywords={query}"
        amz_products.append({
            "title": product['title'],
            "url": functional_url,
            "description": product['description']
        })
    
    # Map high-level niches for subscriptions
    sub_map = {
        "tech": "tech", "finance": "finance", "health": "health", "politics": "politics", "us_politics": "us_politics",
        "movies": "entertainment", "tv": "entertainment", "music": "entertainment", 
        "celebrity": "entertainment", "streaming": "entertainment"
    }
    sub_cat = sub_map.get(category, "default")
    sub_lib = get_subscription_offers()
    sub_products = sub_lib.get(sub_cat, sub_lib.get("default", []))
    
    # Heuristic: If context is provided, prioritize simple keyword matches in the title/desc
    if context:
        context_lower = context.lower()
        cb_products.sort(key=lambda x: (x['title'].lower() in context_lower) or (x['description'].lower() in context_lower), reverse=True)
        amz_products.sort(key=lambda x: (x['title'].lower() in context_lower) or (x['description'].lower() in context_lower), reverse=True)

    cb_sample = random.sample(cb_products, min(num_cb, len(cb_products))) if not context else cb_products[:num_cb]
    amz_sample = random.sample(amz_products, min(num_amz, len(amz_products))) if not context else amz_products[:num_amz]
    sub_sample = random.sample(sub_products, min(num_sub, len(sub_products)))
    
    raw_cj_products = get_cj_products().get(category, get_cj_products().get("default", []))
    ds_products = get_digistore_products().get(category, get_digistore_products().get("default", []))
    imp_products = get_impact_products().get(category, get_impact_products().get("default", []))
    
    cj_sample = random.sample(raw_cj_products, min(2, len(raw_cj_products)))
    ds_sample = random.sample(ds_products, min(2, len(ds_products)))
    
    # Impact enabled only if traffic >= 25000
    traffic = int(config.get('traffic_count', 0))
    imp_sample = random.sample(imp_products, min(2, len(imp_products))) if traffic >= 25000 else []
    
    return {
        "clickbank": cb_sample, 
        "amazon": amz_sample, 
        "subscriptions": sub_sample,
        "cj": cj_sample,
        "digistore": ds_sample,
        "impact": imp_sample
    }

DAILY_TIPS = {
    "movies": "Master the art of color grading in your home theater by adjusting the 'Warm 2' preset for a cinematic look.",
    "tv": "Use a specialized backlight kit to reduce eye strain during your next 10-hour binge session.",
    "music": "Clean your vinyl records with a carbon fiber brush before every play to preserve the grooves for decades.",
    "celebrity": "Follow stylists on 'Behind the Bling' for early leaks on red carpet trends before they hit the mainstream.",
    "awards": "Check the 'Shortlist' categories three months early to win your next Oscars betting pool.",
    "streaming": "Restart your router weekly to clear the cache and maintain 4K bitrate without buffering dips.",
    "books": "Try the 'pomodoro' reading method: 25 minutes of reading followed by a 5-minute break to increase retention.",
    "gaming": "Lower your mouse DPI to 800 for better muscle memory and precision in competitive shooters.",
    "local": "Join your local 'Buy Nothing' group to save money and strengthen community ties in your zip code.",
    "tech": "Enable Two-Factor Authentication (2FA) on all devices today to protect your digital identity from leaks.",
    "finance": "Review your automated subscriptions monthly; cancelling just two forgotten services can save you $300/year.",
    "health": "Drink 500ml of water immediately upon waking to kickstart your metabolism and cognitive functions.",
    "lifestyle": "Roll your clothes instead of folding them when packing—it saves 30% more space and prevents deep wrinkles.",
    "science": "Use a specialized blue-light filter in the evening to maintain your natural circadian rhythm for deeper sleep.",
    "sports": "Dynamic stretching before a workout is 40% more effective at preventing injury than static stretching."
}

def generate_tags(category):
    """Generate 3 tags for category"""
    tags = NEWS_CATEGORIES.get(category, {}).get("tags", ["news", "intelligence", "trends"])
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
    """Load config with Environment Variable priority for Railway/Production"""
    config = {}
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.loads(f.read().strip() or '{}')
        except:
            config = {}
    
    # Environment Variable Overrides (Cloud Deployment)
    env_map = {
        'anthropic_api_key': 'ANTHROPIC_API_KEY',
        'gemini_api_key': 'GEMINI_API_KEY',
        'openai_api_key': 'OPENAI_API_KEY',
        'clickbank_affiliate_id': 'CLICKBANK_ID',
        'amazon_tag': 'AMAZON_TAG',
        'admin_password': 'ADMIN_PASSWORD'
    }
    
    for config_key, env_key in env_map.items():
        val = os.environ.get(env_key)
        if val:
            config[config_key] = val
            
    return config

def save_config(new_config):
    """Merge and Save config"""
    try:
        current = load_config()
        current.update(new_config)
        with open(CONFIG_FILE, 'w') as f:
            json.dump(current, f, indent=2)
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
# SEARCH — Google Trends (real-time trending topics + news articles)
# Uses only stdlib xml.etree.ElementTree + requests — no extra packages needed.
# ============================================================================

# Google Trends category codes used in the daily RSS feed
# https://trends.google.com/trends/trendingsearches/daily/rss?geo=US&cat=<code>
TRENDS_CAT = {
    "movies":      "e",   # Entertainment
    "tv":          "e",
    "music":       "e",
    "celebrity":    "e",
    "awards":      "e",
    "streaming":   "e",
    "books":       "e",
    "gaming":      "e",
    "local":       "",    # Top Stories
    "tech":        "t",   # Sci/Tech
    "finance":     "b",   # Business
    "health":      "h",   # Health
    "lifestyle":   "",
    "science":     "t",
    "sports":      "s",   # Sports
    "politics":    "",    # Global Politics
    "us_politics": "",    # US Politics
}

# Google Trends XML namespace (matches xmlns:ht in the feed)
_GT_NS = "https://trends.google.com/trending/rss"


def crawl_full_article(url, timeout=10):
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
        
        # Keep only a reasonable amount of context for the AI (e.g. first 15,000 chars)
        # This is enough for most articles while staying within common context windows.
        return text[:15000]
    except Exception as e:
        print(f"[Crawl] Failed to fetch {url}: {e}")
        return None


def _fetch_trends_feed(cat_code="", geo="US", timeout=10):
    """
    Fetch one Google Trends Daily RSS feed and return a flat list of article dicts:
      {title, link, source, snippet, trend_title}

    Each trending topic in the feed has 1-5 attached news articles. We flatten
    all of them so callers can rank/filter easily.
    """
    import xml.etree.ElementTree as ET

    url = f"https://trends.google.com/trending/rss?geo={geo}"
    if cat_code:
        url += f"&cat={cat_code}"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=timeout)
        print(f"[Trends] GET {url} → {resp.status_code}")
        if resp.status_code != 200:
            return []

        root = ET.fromstring(resp.content)
    except Exception as exc:
        print(f"[Trends] Failed to fetch/parse {url}: {exc}")
        return []

    articles = []
    channel = root.find("channel")
    if channel is None:
        return []

    for item in channel.findall("item"):
        # The trending topic headline (e.g. "Taylor Swift")
        trend_title_el = item.find("title")
        trend_title = trend_title_el.text.strip() if trend_title_el is not None and trend_title_el.text else ""

        # Each topic has ht:news_item child elements with article details
        for news_item in item.findall(f"{{{_GT_NS}}}news_item"):
            title_el   = news_item.find(f"{{{_GT_NS}}}news_item_title")
            url_el     = news_item.find(f"{{{_GT_NS}}}news_item_url")
            source_el  = news_item.find(f"{{{_GT_NS}}}news_item_source")
            snippet_el = news_item.find(f"{{{_GT_NS}}}news_item_snippet")

            title   = (title_el.text   or "").strip() if title_el   is not None else trend_title
            link    = (url_el.text     or "").strip() if url_el     is not None else ""
            source  = (source_el.text  or "").strip() if source_el  is not None else "Google Trends"
            snippet = (snippet_el.text or "").strip() if snippet_el is not None else ""

            if not link or not title:
                continue

            # Strip HTML from snippet just in case
            snippet = re.sub(r"<[^>]+>", "", snippet).strip()[:300]

            articles.append({
                "title":       title,
                "link":        link,
                "source":      source,
                "snippet":     snippet or f"Trending: {trend_title}",
                "trend_topic": trend_title,
            })

    print(f"[Trends] {url} → {len(articles)} news items")
    return articles


def search_with_google_trends(num_results, query_filter, categories, config=None):
    """
    Discover trending news articles via Google Trends Daily RSS.

    - No API key. No extra libraries. Uses only `requests` + stdlib `xml`.
    - Google's new /trending/rss endpoint does NOT filter by ?cat=, so we fetch
      once and do category assignment ourselves via keyword matching.
    - 'local' category: supplements with a Google News geo-search feed.
    - Trending mode (6+ categories): all articles pass the category filter.
    """
    print(f"[Trends] Searching {num_results} articles | cats={categories} | filter='{query_filter}'")

    geo = (config or {}).get("geo", "US")
    is_trending = len(categories) >= 6

    # ── Category keyword map ────────────────────────────────────────────────
    CAT_KWS = {
    "movies":      ["movie review", "box office", "film release", "cinema news", "blockbuster", "indie film", "trailers", "actors", "directors", "oscars"],
    "tv":          ["tv shows", "netflix series", "hbo max", "streaming release", "tv series review", "binge watch", "emmy awards", "episodic news"],
    "music":       ["new album", "music tour", "grammys", "billboard charts", "spotify hits", "vinyl release", "concert tickets", "music festivals"],
    "celebrity":   ["celebrity gossip", "hollywood news", "red carpet", "paparazzi", "star scandals", "celeb style", "interview"],
    "awards":      ["academy awards", "oscars", "golden globes", "grammys", "emmys", "film festivals", "award ceremony", "red carpet"],
    "streaming":   ["streaming services", "netflix", "disney plus", "hulu", "amazon prime", "hbo max", "paramount plus", "streaming news"],
    "books":       ["book review", "bestsellers", "new release", "literary news", "authors", "book club", "poetry", "novels"],
    "gaming":      ["video games", "esports", "ps5", "xbox", "nintendo switch", "pc gaming", "gaming news", "game review", "twitch"],
    "local":       ["local news", "community events", "neighborhood updates", "regional reports", "town hall", "local crime", "local business"],
    "tech":        ["artificial intelligence", "ai news", "gadgets", "silicon valley", "software update", "robotics", "big tech", "semiconductor"],
    "finance":     ["stock market", "business news", "economy", "investing", "crypto", "bitcoin", "startup", "entrepreneurship", "wall street"],
    "health":      ["wellness", "nutrition", "mental health", "fitness", "medical news", "diet", "mental wellness", "healthy living"],
    "lifestyle":   ["travel", "fashion", "home decor", "food and drink", "luxury living", "real estate", "culture"],
    "science":     ["space exploration", "nasa", "climate change", "environment", "nature", "physics", "biology", "scientific discovery"],
    "sports":      ["nba", "nfl", "mlb", "soccer", "tennis", "formula 1", "olympics", "sports news", "scores"],
    "politics":    ["global politics", "world news", "international relations", "united nations", "geopolitics", "foreign policy"],
    "us_politics": ["us politics", "white house", "congress", "elections", "senate", "ballot", "democrat", "republican"],
}

    def best_category(art, cats):
        """Return the closest matching category from the user's selection."""
        combined = (art["title"] + " " + art["snippet"] + " " + art["trend_topic"]).lower()
        for c in cats:
            if any(kw in combined for kw in CAT_KWS.get(c, [])):
                return c
        return cats[0] if cats else "general"
        
    def is_english(text):
        """Verify text is predominantly English. Ratio: 90% ASCII for high quality."""
        if not text: return False
        alpha_chars = [c for c in text if c.isalpha()]
        if not alpha_chars: return False
        ascii_alpha = [c for c in alpha_chars if ord(c) < 128]
        return (len(ascii_alpha) / len(alpha_chars)) > 0.90

    # ── Fetch the single Trends feed (one HTTP call) ────────────────────────
    all_raw = _fetch_trends_feed(cat_code="", geo=geo)
    print(f"[Trends] Raw articles from feed: {len(all_raw)}")

    # Supplement with Google News geo-search for local category
    if "local" in categories:
        try:
            loc = get_location_from_ip()
            location_info = (config or {}).get("custom_location") or loc.get("description", "")
            if location_info and location_info != "Unknown Location":
                import xml.etree.ElementTree as ET
                local_url = f"https://news.google.com/rss/search?q={requests.utils.quote(location_info)}&hl=en-US&gl=US&ceid=US:en"
                local_resp = requests.get(local_url, headers={
                    "User-Agent": "Mozilla/5.0 (compatible; KnotStrandedBot/1.0)"
                }, timeout=8)
                if local_resp.status_code == 200:
                    local_root = ET.fromstring(local_resp.content)
                    local_ch = local_root.find("channel")
                    if local_ch is not None:
                        for item in local_ch.findall("item"):
                            t = item.findtext("title", "").strip()
                            l = item.findtext("link",  "").strip()
                            s = re.sub(r"<[^>]+>", "", item.findtext("description", "")).strip()[:300]
                            src_el = item.find("source")
                            src = src_el.text.strip() if src_el is not None and src_el.text else "Google News"
                            if t and l:
                                all_raw.append({"title": t, "link": l, "source": src,
                                                "snippet": s or f"Local news: {location_info}",
                                                "trend_topic": location_info})
                    print(f"[Trends] Added local articles → total: {len(all_raw)}")
        except Exception as exc:
            print(f"[Trends] Local supplement failed: {exc}")

    # ── Deduplicate by URL & Filter English ──────────────────────────────
    seen_links = set()
    unique_raw = []
    for art in all_raw:
        if art["link"] not in seen_links:
            combined_text = art["title"] + " " + art.get("snippet", "") + " " + art.get("trend_topic", "")
            if is_english(combined_text):
                seen_links.add(art["link"])
                unique_raw.append(art)

    # ── Category & Query Filtering ──────────────────────────────────────────
    is_trending = len(categories) >= 6
    filtered_pool = []
    
    query_lower = (query_filter or "").lower().strip()
    query_words = query_lower.split() if query_lower else []

    for art in unique_raw:
        # Category Filter
        title_norm = art["title"].lower()
        snippet_norm = art.get("snippet", "").lower()
        trend_norm = art.get("trend_topic", "").lower()
        combined = f"{title_norm} {snippet_norm} {trend_norm}"
        
        # 1. Scoring logic against selected categories (Whole words only)
        # We give 3x weight to title matches as they define the story better
        scores = {}
        for c in categories:
            s = 0
            for kw in CAT_KWS.get(c, []):
                # Search for whole word kw in title (Weight: 3)
                if re.search(rf'\b{re.escape(kw)}\b', title_norm):
                    s += 3
                # Search in snippet/trend (Weight: 1)
                elif re.search(rf'\b{re.escape(kw)}\b', snippet_norm + " " + trend_norm):
                    s += 1
            scores[c] = s
            
        if any(scores.values()):
            matched_cat = max(scores, key=scores.get)
        elif is_trending:
            # If trending, find best fit across all categories
            all_scores = {}
            for c, kws in CAT_KWS.items():
                if c == 'local': continue
                s = 0
                for kw in kws:
                    if re.search(rf'\b{re.escape(kw)}\b', title_norm): s += 3
                    elif re.search(rf'\b{re.escape(kw)}\b', snippet_norm + " " + trend_norm): s += 1
                all_scores[c] = s
            matched_cat = max(all_scores, key=all_scores.get) if any(all_scores.values()) else "general"
        else:
            continue
        
        art["category"] = matched_cat

        # Query Filter
        if query_words:
            if not all(w in combined for w in query_words):
                continue
        
        filtered_pool.append(art)

    # ── Duplicate Story Detection (Similarity) ──────────────────────────────
    result = []
    seen_story_keywords = [] # list of sets of keywords
    seen_entities = []       # list of sets of proper nouns
    
    STOP_WORDS = {'the','a','an','and','or','but','in','on','at','to','for','with','was','is','were','has','been','by','from','at'}

    def get_entities(title):
        """Extract Proper Nouns and Acronyms."""
        words = re.findall(r'\b[A-Z][a-zA-Z]+\b|\b[A-Z]{2,}\b', title)
        return set(words) - {'The','A','An','And','In','On','At','To','For','With','By','Is','Are','Was','Were'}

    def is_similar(title, prev_words, prev_entities):
        """Aggressive check for story duplication."""
        entities = get_entities(title)
        ent_overlap = entities.intersection(prev_entities) if entities and prev_entities else set()
        
        # Match 2+ proper nouns -> same story
        if len(ent_overlap) >= 2: return True
            
        w1 = set(re.findall(r'\w+', title.lower())) - STOP_WORDS
        if not w1 or not prev_words: return False
        
        overlap = w1.intersection(prev_words)
        # Aggressive 30% threshold if they share a major entity (e.g. "Block")
        threshold = 0.25 if len(ent_overlap) >= 1 else 0.40
        return len(overlap) >= (max(len(w1), len(prev_words)) * threshold)

    for art in filtered_pool:
        if len(result) >= num_results: break
            
        title_words = set(re.findall(r'\w+', art["title"].lower())) - STOP_WORDS
        entities = get_entities(art["title"])
        
        if any(is_similar(art["title"], pw, pe) for pw, pe in zip(seen_story_keywords, seen_entities)):
            continue
            
        seen_story_keywords.append(title_words)
        seen_entities.append(entities)
        
        domain_match = re.search(r"https?://(?:www\.)?([^/?#]+)", art["link"])
        source = art.get("source") or (domain_match.group(1) if domain_match else "Trends")
        result.append({
            "id":       len(result) + 1,
            "title":    art["title"][:120],
            "link":     art["link"],
            "source":   source,
            "snippet":  art["snippet"],
            "category": art.get("category", categories[0]),
        })

    print(f"[Trends] ✓ Returning {len(result)} unique filtered articles")
    
    # ── Write to Text File ──────────────────────────────────────────────────
    try:
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open('crawled_articles.txt', 'w', encoding='utf-8') as f:
            f.write(f"Crawled Articles ({current_time})\n")
            f.write(f"Total Found: {len(result)}\n")
            f.write("="*60 + "\n\n")
            for a in result:
                f.write(f"Title: {a['title']}\n")
                f.write(f"Category: {NEWS_CATEGORIES.get(a['category'], {}).get('name', a['category'])}\n")
                f.write(f"Source: {a['source']}\n")
                f.write(f"Link: {a['link']}\n")
                f.write(f"Snippet: {a['snippet']}\n")
                f.write("-" * 60 + "\n")
                print(f"  {a['id']}. [{a['category']}] {a['title'][:70]}")
    except Exception as e:
        print(f"[Trends] Error generating crawled articles text file: {e}")
            
    return result, None


# Alias used by search_with_retry and auto-pilot
def search_with_rss(num_results, query_filter, categories, config=None):
    """Alias → search_with_google_trends"""
    return search_with_google_trends(num_results, query_filter, categories, config)

# ============================================================================
# SEARCH - GEMINI (deprecated stub — delegates to Google Trends)
# ============================================================================

def search_with_gemini(api_key, num_results, query_filter, categories, config=None):
    """Deprecated — delegates to search_with_google_trends"""
    return search_with_google_trends(num_results, query_filter, categories, config)


# ============================================================================
# SEARCH - CLAUDE (deprecated stub — delegates to Google Trends)
# ============================================================================

def search_with_claude(api_key, num_results, query_filter, categories, config=None):
    """Deprecated — delegates to search_with_google_trends"""
    return search_with_google_trends(num_results, query_filter, categories, config)



# ============================================================================
# CONTENT CLEANUP
# ============================================================================

def clean_blog_content(content, blog_title):
    """Remove unwanted text like 'Full URL', AI artifacts and clean up content"""
    
    # Remove AI preambles and title echoes
    content = re.sub(r'^(?:\*\*)?Title:.*?\n', '', content, flags=re.IGNORECASE | re.MULTILINE)
    content = re.sub(r'^(?:\*\*)?Headline:.*?\n', '', content, flags=re.IGNORECASE | re.MULTILINE)
    
    # Remove artifacts like lone double asterisks at the very start
    content = content.lstrip('* ').lstrip('\n')

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

def generate_blog_with_gemini(api_key, news_item, temperature, max_tokens, writer, links, target_words=500):
    """Generate blog with Gemini"""
    try:
        import google.generativeai as genai
        
        print(f"[Gemini Blog {news_item['id']}] Generating {target_words} words as {writer['name']}...")
        genai.configure(api_key=api_key)
        
        cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['clickbank'])])
        amz_text = "\n".join([f"[AMZ{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['amazon'])])
        sub_text = "\n".join([f"[SUB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['subscriptions'])])
        
        # Use full context if available, fallback to snippet
        full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
        
        # Meta summary length adjusted by total length
        meta_len = 100 if target_words > 400 else 60

        prompt = f"""You are {writer['name']}, {writer['title']} at KnotStranded Media.
Write a deep-dive research article for our {news_item.get('category', 'General')} vertical.
Tone: {writer.get('style', 'Expert')} | VOICE: {writer.get('voice', 'Professional')}

SEO INSTRUCTIONS: 
1. Research high-volume keywords related to the topic.
2. Use a Provocative, SEO-optimized title.
3. Use semantic H2 and H3 tags.
4. Include a {meta_len}-word summary at the start (Meta info).
5. MONETIZATION: Select the 2-3 most RELEVANT products from the pool below that best fit the article context. Weave them naturally into the narrative.
6. CONTENT DEPTH: Use the provided SOURCE CONTEXT (full article text) to write a detailed, authoritative {target_words}-word story.

Write a {target_words}-word deep-dive article for our {news_item.get('category', 'General')} section based on: "{news_item['title']}"
SOURCE CONTEXT: {full_context}

PRODUCT POOL (Choose the best matches):
CLICKBANK: {cb_text}
AMAZON: {amz_text}
{cj_text}
{ds_text}
{imp_text}
PREMIUM SUBSCRIPTIONS: {sub_text}

Format:
TITLE: [Provocative Title]
CONTENT: [~{target_words} words. Naturally weave in selected products using markers like [CB1] or [AMZ2]. 
CRITICAL: Include markers like [PHOTO1], [PHOTO2] between sections for visual context.]"""
        
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        # target words * 4 for plenty of buffer (prevent truncation)
        out_tokens = max(2000, target_words * 4)
        config = genai.GenerationConfig(temperature=float(temperature), max_output_tokens=out_tokens)
        
        # Enable streaming to show manual progress in the dashboard console
        response = model.generate_content(prompt, generation_config=config, stream=True)
        
        full_text = ""
        chunk_buf = 0
        for chunk in response:
            if chunk.text:
                full_text += chunk.text
                chunk_buf += len(chunk.text)
                if chunk_buf > 200:
                    clean_chunk = chunk.text.strip().replace('\n', ' ')[:60]
                    if clean_chunk:
                        log_gen(f"    ✍️ ...{clean_chunk}...", "writing")
                    chunk_buf = 0
        
        elapsed = time.time() - start_t
        word_count = len(full_text.split())
        rate = word_count / elapsed if elapsed > 0 else 0
        log_gen(f"    📈 Stats: {word_count} words in {elapsed:.1f}s ({rate:.1f} w/s)", "info")
        
        # Parsing logic same as before but using full_text
        title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', full_text, re.IGNORECASE)
        content_match = re.search(r'CONTENT:\s*(.+)', full_text, re.IGNORECASE | re.DOTALL)
        
        title = title_match.group(1).strip() if title_match else news_item['title']
        content = content_match.group(1).strip() if content_match else full_text
        
        for i, link in enumerate(links.get('clickbank', [])):
            content = re.sub(rf'(?:\*\*?)?\[?CB{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link cb-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('amazon', [])):
            content = re.sub(rf'(?:\*\*?)?\[?AMZ{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link amz-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('subscriptions', [])):
            content = re.sub(rf'(?:\*\*?)?\[?SUB{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link sub-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('cj', [])):
            content = re.sub(rf'(?:\*\*?)?\[?CJ{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link cj-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('digistore', [])):
            content = re.sub(rf'(?:\*\*?)?\[?DS{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link ds-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('impact', [])):
            content = re.sub(rf'(?:\*\*?)?\[?IMP{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link imp-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('cj', [])):
            content = re.sub(rf'(?:\*\*?)?\[?CJ{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link cj-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('digistore', [])):
            content = re.sub(rf'(?:\*\*?)?\[?DS{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link ds-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('impact', [])):
            content = re.sub(rf'(?:\*\*?)?\[?IMP{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link imp-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('cj', [])):
            content = re.sub(rf'(?:\*\*?)?\[?CJ{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link cj-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('digistore', [])):
            content = re.sub(rf'(?:\*\*?)?\[?DS{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link ds-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('impact', [])):
            content = re.sub(rf'(?:\*\*?)?\[?IMP{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link imp-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
            
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

def generate_blog_with_claude(api_key, news_item, temperature, max_tokens, writer, links, target_words=500):
    """Generate blog with Claude"""
    try:
        print(f"[Claude Blog {news_item['id']}] Generating {target_words} words as {writer['name']}...")
        client = anthropic.Anthropic(api_key=api_key)
        
        cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['clickbank'])])
        amz_text = "\n".join([f"[AMZ{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['amazon'])])
        sub_text = "\n".join([f"[SUB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['subscriptions'])])
        
        # Use full context if available, fallback to snippet
        full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
        
        prompt = f"""You are {writer['name']}, {writer['title']} at KnotStranded Media.
Write a high-authority article for our {news_item.get('category', 'General')} vertical.
SEO TASK (AGGRESSIVE):
1. TARGET KEYWORDS: Identify and use the most high-volume terms for "{news_item['title']}".
2. SEMANTIC STRUCTURE: Use H2/H3 tags. Include at least 2 bulleted lists.
3. ENTITY LINKING: Reference other major entities to build context.
4. WORD COUNT: Write a complete ~{target_words}-word authoritative guide.
5. CONTENT DEPTH: Use the provided SOURCE CONTEXT (full article text) to ensure accuracy and depth.
6. PRODUCT PLACEMENT: Below is a POOL of affiliate products. Analyze the article context and select the 2-3 products that are most relevant to this specific story. Weave them in naturally.

Topic: {news_item['title']}
SOURCE CONTEXT: {full_context}

AFFILIATE PRODUCT POOL (Select best matches):
CLICKBANK: {cb_text}
AMAZON: {amz_text}
{cj_text}
{ds_text}
{imp_text}
SUBSCRIPTIONS: {sub_text}

FORMAT:
TITLE: [High-CTR Headline]
CONTENT: [~{target_words}-word research guide. You MUST include markers for selected products like [CB1], [AMZ1] etc naturally.
CRITICAL: Insert the exact text [PHOTO1] and [PHOTO2] strategically between paragraphs.]"""

        # target words * 4 for plenty of buffer (prevent truncation)
        out_tokens = max(2000, target_words * 4)
        
        import time
        start_t = time.time()
        full_text = ""
        chunk_buf = 0
        
        with client.messages.stream(
            model="claude-3-5-sonnet-20240620",
            max_tokens=out_tokens,
            temperature=float(temperature),
            messages=[{"role": "user", "content": prompt}]
        ) as stream:
            for text in stream.text_stream:
                full_text += text
                chunk_buf += len(text)
                if chunk_buf > 200:
                    clean_chunk = text.strip().replace('\n', ' ')[:60]
                    if clean_chunk:
                        log_gen(f"    ✍️ ...{clean_chunk}...", "writing")
                    chunk_buf = 0
                    
        elapsed = time.time() - start_t
        word_count = len(full_text.split())
        rate = word_count / elapsed if elapsed > 0 else 0
        log_gen(f"    📈 Stats: {word_count} words in {elapsed:.1f}s ({rate:.1f} w/s)", "info")
                    
        title = re.search(r'TITLE:\s*(.+?)(?:\n|$)', full_text, re.I).group(1).strip() if re.search(r'TITLE:\s*(.+?)(?:\n|$)', full_text, re.I) else news_item['title']
        content = re.search(r'CONTENT:\s*(.+)', full_text, re.I | re.S).group(1).strip() if re.search(r'CONTENT:\s*(.+)', full_text, re.I | re.S) else full_text
        
        for i, link in enumerate(links.get('clickbank', [])):
            content = re.sub(rf'(?:\*\*?)?\[?CB{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link cb-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('amazon', [])):
            content = re.sub(rf'(?:\*\*?)?\[?AMZ{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link amz-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('subscriptions', [])):
            content = re.sub(rf'(?:\*\*?)?\[?SUB{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link sub-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('cj', [])):
            content = re.sub(rf'(?:\*\*?)?\[?CJ{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link cj-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('digistore', [])):
            content = re.sub(rf'(?:\*\*?)?\[?DS{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link ds-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('impact', [])):
            content = re.sub(rf'(?:\*\*?)?\[?IMP{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link imp-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('cj', [])):
            content = re.sub(rf'(?:\*\*?)?\[?CJ{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link cj-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('digistore', [])):
            content = re.sub(rf'(?:\*\*?)?\[?DS{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link ds-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('impact', [])):
            content = re.sub(rf'(?:\*\*?)?\[?IMP{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link imp-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('cj', [])):
            content = re.sub(rf'(?:\*\*?)?\[?CJ{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link cj-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('digistore', [])):
            content = re.sub(rf'(?:\*\*?)?\[?DS{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link ds-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('impact', [])):
            content = re.sub(rf'(?:\*\*?)?\[?IMP{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link imp-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
            
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

def generate_blog_with_retry(config, news_item, writer, clickbank_links, max_retries=3):
    """
    Generate with retry across multiple providers.
    Uses aTiered Rescue System to ensure the 'Desired Outcome' (a generated post) is met even if 
    primary providers hit limits or unrecoverable errors.
    """
    primary_provider = config.get('ai_provider', 'claude')
    temp = float(config.get('temperature', 0.8))
    # Max output tokens for LLM, ensuring enough buffer for target_words
    output_tokens_buffer = max(2000, int(config.get('word_count', 500)) * 4)
    
    # Priority list of fallback providers based on primary choice
    # We want providers with high uptime and DIFFERENT ecosystems as fallbacks
    fallbacks = ['gemini', 'chatgpt', 'claude', 'groq', 'openrouter']
    if primary_provider in fallbacks:
        fallbacks.remove(primary_provider)
    
    # Last Stand: Ollama (if configured locally, it's immortal against rate limits)
    provider_chain = [primary_provider] + fallbacks + ['ollama']
    
    for provider in provider_chain:
        # Verify provider has credentials
        if provider == 'chatgpt' and not config.get('openai_api_key'): continue
        if provider == 'gemini' and not config.get('gemini_api_key'): continue
        if provider == 'claude' and not config.get('anthropic_api_key'): continue
        if provider == 'groq' and not config.get('groq_api_key'): continue
        if provider == 'openrouter' and not config.get('openrouter_api_key'): continue
        
        log_gen(f"  - Attempting generation with {provider.title()}...", "info")
        
        for attempt in range(max_retries):
            # If we are in a retry loop, use a slightly more conservative temperature to increase predictability
            current_temp = temp if attempt == 0 else max(0.4, temp - 0.2)
            
            try:
                if provider == 'chatgpt':
                    return generate_blog_with_chatgpt(config['openai_api_key'], news_item, current_temp, output_tokens_buffer, writer, clickbank_links, int(config.get('word_count', 500)))
                elif provider == 'gemini':
                    return generate_blog_with_gemini(config['gemini_api_key'], news_item, current_temp, output_tokens_buffer, writer, clickbank_links, int(config.get('word_count', 500)))
                elif provider == 'groq':
                    return generate_blog_with_groq(config['groq_api_key'], news_item, current_temp, output_tokens_buffer, writer, clickbank_links, int(config.get('word_count', 500)))
                elif provider == 'openrouter':
                    return generate_blog_with_openrouter(config['openrouter_api_key'], news_item, current_temp, output_tokens_buffer, writer, clickbank_links, int(config.get('word_count', 500)))
                elif provider == 'ollama':
                    return generate_blog_with_ollama(config, news_item, writer, clickbank_links, int(config.get('word_count', 500)))
                else: # claude
                    return generate_blog_with_claude(config['anthropic_api_key'], news_item, current_temp, output_tokens_buffer, writer, clickbank_links, int(config.get('word_count', 500)))
            
            except Exception as e:
                err_msg = str(e).lower()
                is_rate_limit = any(keyword in err_msg for keyword in ['rate', 'quota', '429', 'overloaded', 'capacity'])
                
                # If it's a rate limit, wait and retry that specific provider
                if is_rate_limit:
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 20
                        log_gen(f"    ⚠️ {provider.title()} rate limited. Backing off {wait_time}s...", "info")
                        time.sleep(wait_time)
                        continue # Retry same provider
                    else:
                        log_gen(f"    ❌ {provider.title()} exhausted {max_retries} attempts. Triggering Rescue Provider...", "err")
                        break # Go to next provider in chain
                
                # If it's a content/policy block or other unrecoverable error, skip to next provider immediately
                else:
                    log_gen(f"    ❌ {provider.title()} error: {err_msg[:100]}... Switching providers.", "err")
                    break # Go to next provider in chain
    
    # If we fall through the entire chain
    raise Exception("All AI providers exhausted or failed. Article generation aborted to prevent infinite loops.")

# ============================================================================
# GENERATION - CHATGPT
# ============================================================================

def generate_blog_with_chatgpt(api_key, news_item, temperature, max_tokens, writer, clickbank_links, target_words=500):
    """Generate blog with ChatGPT"""
    try:
        import openai
        
        print(f"[ChatGPT Blog {news_item['id']}] Generating {target_words} words as {writer['name']}...")
        openai.api_key = api_key
        
        links_text = "\n".join([f"[LINK{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(clickbank_links)])
        
        # Use full context if available, fallback to snippet
        full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
        
        # Prepare pools
        cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(clickbank_links)])
        
        prompt = f"""You are {writer['name']}, {writer['title']} at KnotStranded Media.
Write a deep-dive, professional news article for our {news_item.get('category', 'General') } section.

STYLE: {writer.get('style', 'Engaging')}
CONTENT DEPTH: Use the provided SOURCE CONTEXT (full article text) to ensure accuracy and depth.
PRODUCT PLACEMENT: Select the 2-3 most relevant affiliate products from the pool below. Weave them in using [CB1], [CB2] style markers.


MONETIZATION POOL:
{cb_text}

Format:
TITLE: [Provocative Title]
CONTENT: [~{target_words} words. Naturally weave in selected products and markers [PHOTO1], [PHOTO2].]"""
        
        # target words * 4 for plenty of buffer (prevent truncation)
        out_tokens = max(2000, target_words * 4)
        
        import time
        start_t = time.time()
        full_text = ""
        chunk_buf = 0
        
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"You are {writer['name']}."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=out_tokens,
            temperature=float(temperature),
            stream=True
        )
        
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                full_text += text
                chunk_buf += len(text)
                if chunk_buf > 200:
                    clean_chunk = text.strip().replace('\n', ' ')[:60]
                    if clean_chunk:
                        log_gen(f"    ✍️ ...{clean_chunk}...", "writing")
                    chunk_buf = 0
        
        elapsed = time.time() - start_t
        word_count = len(full_text.split())
        rate = word_count / elapsed if elapsed > 0 else 0
        log_gen(f"    📈 Stats: {word_count} words in {elapsed:.1f}s ({rate:.1f} w/s)", "info")
        
        title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', full_text, re.IGNORECASE)
        content_match = re.search(r'CONTENT:\s*(.+)', full_text, re.IGNORECASE | re.DOTALL)
        
        title = title_match.group(1).strip() if title_match and content_match else news_item['title']
        content = content_match.group(1).strip() if title_match and content_match else full_text
        
        for i, link in enumerate(clickbank_links):
            content = re.sub(rf'(?:\*\*?)?\[?CB{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" target="_blank" rel="nofollow sponsored">{link["title"]}</a>', content, flags=re.IGNORECASE)
        
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
# GENERATION - OPEN SOURCE CLOUD (Groq / OpenRouter)
# ============================================================================

def generate_blog_with_groq(api_key, news_item, temperature, max_tokens, writer, links, target_words=500):
    """Generate blog with Groq (Llama 3 / Mixtral)"""
    try:
        from openai import OpenAI
        client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=api_key)
        
        # Model mapping
        model = "llama3-70b-8192" # Default high-quality open-source model
        
        cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['clickbank'])])
        full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
        
        prompt = f"""You are {writer['name']}, {writer['title']} at KnotStranded Media.
Write a deep-dive, professional news article for our {news_item.get('category', 'General')} vertical.
SOURCE CONTEXT: {full_context}

MONETIZATION: Select 2-3 most relevant from:
{cb_text}

FORMAT:
TITLE: [Headline]
CONTENT: [~{target_words} words. Use markers [CB1] and [PHOTO1], [PHOTO2].]"""

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=float(temperature),
            max_tokens=max_tokens # Use the max_tokens passed from generate_blog_with_retry
        )
        
        full_text = response.choices[0].message.content
        title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', full_text, re.IGNORECASE)
        content_match = re.search(r'CONTENT:\s*(.+)', full_text, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else news_item['title']
        content = content_match.group(1).strip() if content_match else full_text
        
        # Post-process links
        for i, link in enumerate(links['clickbank']):
            content = re.sub(rf'\[?CB{i+1}\]?', f'<a href="{link["url"]}" class="affiliate-link cb-link">{link["title"]}</a>', content, flags=re.IGNORECASE)

        return {'title': title, 'content': clean_blog_content(content, title), 'writer': writer, 'category': news_item.get('category', 'tech'), 'affiliate_links': links}
    except Exception as e:
        print(f"[Groq Error] {e}")
        raise

def generate_blog_with_openrouter(api_key, news_item, temperature, max_tokens, writer, links, target_words=500):
    """Generate blog with OpenRouter (Access to DeepSeek, Llama3, etc.)"""
    try:
        import requests
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        
        # Default to a strong open-source model
        model = "meta-llama/llama-3-70b-instruct"
        
        cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links['clickbank'])])
        full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
        
        prompt = f"You are {writer['name']}. Write a {target_words} word article for our {news_item.get('category', 'General')} section.\n\nCONTEXT: {full_context}\n\nPOOL:\n{cb_text}\n\nFORMAT: TITLE: ... CONTENT: ..."

        data = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": float(temperature),
            "max_tokens": max_tokens # Use the max_tokens passed from generate_blog_with_retry
        }
        
        r = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        r.raise_for_status()
        full_text = r.json()['choices'][0]['message']['content']
        
        title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', full_text, re.IGNORECASE)
        content_match = re.search(r'CONTENT:\s*(.+)', full_text, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else news_item['title']
        content = content_match.group(1).strip() if content_match else full_text
        
        # Post-process links
        for i, link in enumerate(links['clickbank']):
            content = re.sub(rf'\[?CB{i+1}\]?', f'<a href="{link["url"]}" class="affiliate-link cb-link">{link["title"]}</a>', content, flags=re.IGNORECASE)

        return {'title': title, 'content': clean_blog_content(content, title), 'writer': writer, 'category': news_item.get('category', 'tech'), 'affiliate_links': links}
    except Exception as e:
        print(f"[OpenRouter Error] {e}")
        raise

# ============================================================================
# GENERATION - OLLAMA (Local LLM)
# ============================================================================

def generate_blog_with_ollama(config_full, news_item, writer, links, target_words=500):
    """Generate blog with Local Ollama"""
    try:
        model_name = config_full.get('ollama_model', 'llama3')
        print(f"[Ollama Blog {news_item['id']}] Generating {target_words} words using {model_name}...")
        
        # Consistent prompting
        cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('clickbank', []))])
        amz_text = "\n".join([f"[AMZ{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('amazon', []))])
        cj_text = "\n".join([f"[CJ{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('cj', []))])
        ds_text = "\n".join([f"[DS{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('digistore', []))])
        imp_text = "\n".join([f"[IMP{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('impact', []))])
        
        # Use full context if available, fallback to snippet
        full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
        
        prompt = f"""You are {writer['name']}, {writer['title']} at KnotStranded Media.
Write a deep-dive, professional news article for our {news_item.get('category', 'General')} section from the provided SOURCE CONTEXT.
Target: ~{target_words} words.

Topic: {news_item['title']}
SOURCE CONTEXT: {full_context}

MONETIZATION POOL (Select 2-3 most relevant):
{cb_text}
{amz_text}
{cj_text}
{ds_text}
{imp_text}

FORMAT requirements:
TITLE: [Headline]
CONTENT: [The article body. Naturally use markers like [CB1] or [AMZ2] for selected products. 
Place markers [PHOTO1], [PHOTO2] between sections.]"""

        start_t = time.time()
        
        # Ollama API call
        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": max(2000, target_words * 4) 
            }
        }
        
        # Force direct IPv4 (127.0.0.1) as tests showed localhost/IPv6 fails on this Mac/VPN setup.
        target_url = "http://127.0.0.1:11434/api/generate"
        
        # Clear all proxy and session state for this call
        for var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy']:
            if var in os.environ: del os.environ[var]
        os.environ['NO_PROXY'] = '127.0.0.1,localhost,[::1]'

        try:
            # Use a direct, fresh request to avoid session pool contamination
            r = requests.post(target_url, json=payload, timeout=300, proxies={'http': None, 'https': None})
            r.raise_for_status()
            full_text = r.json().get('response', '')
            
            if not full_text:
                raise Exception("Ollama returned empty response.")
        except Exception as conn_err:
            log_gen(f"  ❌ Ollama Error: {str(conn_err)[:100]}", 'err')
            log_gen("  💡 Pro-tip: Ensure Ollama is running and no firewall is blocking Python.", "info")
            raise conn_err
        
        elapsed = time.time() - start_t
        word_count = len(full_text.split())
        rate = word_count / elapsed if elapsed > 0 else 0
        log_gen(f"    📈 Local Stats ({model_name}): {word_count} words in {elapsed:.1f}s ({rate:.1f} w/s)", "info")
        
        title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', full_text, re.IGNORECASE)
        content_match = re.search(r'CONTENT:\s*(.+)', full_text, re.IGNORECASE | re.DOTALL)
        
        title = title_match.group(1).strip() if title_match else news_item['title']
        content = content_match.group(1).strip() if content_match else full_text
        
        # 3. Post-Process Links (Standardize markers to HTML)
        link_types = [('clickbank', 'cb'), ('amazon', 'amz'), ('subscriptions', 'sub'), ('cj', 'cj'), ('digistore', 'ds'), ('impact', 'imp')]
        for link_key, css_class in link_types:
            for i, link in enumerate(links.get(link_key, [])):
                marker_prefix = link_key[:2].upper() if link_key != 'subscriptions' else 'SUB'
                img_attr = f' data-img="{link.get("image", "")}"' if link.get("image") else ''
                content = re.sub(rf'(?:\*\*?)?\[?{marker_prefix}{i+1}[^\]\n]*\]?(?:\*\*?)?', f'<a href="{link["url"]}" class="affiliate-link {css_class}-link"{img_attr}>{link["title"]}</a>', content, flags=re.IGNORECASE)

        # 4. Final Cleanup
        content = clean_blog_content(content, title)
        
        return {
            'title': title,
            'content': content,
            'writer': writer,
            'category': news_item.get('category', 'entertainment'),
            'affiliate_links': links
        }

    except Exception as e:
        print(f"[Ollama] Error: {e}")
        raise

# ============================================================================
# IMAGE GENERATION
# ============================================================================

def generate_featured_image(api_key, title, blog_id, category='entertainment', context=None):
    """Generate image with DALL-E with context-aware prompts"""
    try:
        import openai
        
        print(f"[Image {blog_id}] Generating ({category}) with context...")
        openai.api_key = api_key
        
        # Category-specific visual styles
        styles = {
            "tech": "Futuristic, sleek, digital innovation aesthetic, high-tech neon accents",
            "finance": "Professional, data-driven, clean minimalism, sophisticated corporate colors",
            "health": "Natural, organic, bright and airy, wellness-focused sanctuary vibes",
            "lifestyle": "Vibrant, trendy, warm lighting, cozy and aesthetic arrangement",
            "science": "Cosmic, micro-detailed, scientific discovery atmosphere, intriguing and accurate",
            "sports": "Action-oriented, dynamic motion blur, high-energy stadium atmosphere",
            "local": "Community-focused, warm neighborhood vibe, authentic and welcoming",
            "gaming": "Cyberpunk, immersive, high-contrast gaming environment, vibrant RGB lighting",
            "books": "Classic, literary, deep wood textures, cozy library or artistic cover style",
            "movies": "Cinematic, film-noir or blockbuster lighting, dramatic composition",
            "music": "Rhythmic, audio-visual, abstract sound waves or artistic performance style"
        }
        
        style_desc = styles.get(category, "Cinematic, elegant editorial style")
        
        # Use context summary if available
        context_prompt = f"Depicting: {context[:200]}..." if context else f"Topic: {title}"
        prompt = f"Hyper-realistic, 8k, ultra-detailed editorial photography for a {category} magazine cover. {context_prompt}. Style: {style_desc}. Professional lighting, masterpiece, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO LOGOS, NO TYPOGRAPHY."
        
        response = openai.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1792x1024",
            quality="hd",
            n=1
        )
        img_url = response.data[0].url
        img_data = requests.get(img_url, timeout=30)
        
        if img_data.status_code == 200:
            os.makedirs(GENERATED_IMG_DIR, exist_ok=True)
            filename = f"featured_{blog_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            filepath = os.path.join(GENERATED_IMG_DIR, filename)
            with open(filepath, 'wb') as f:
                f.write(img_data.content)
            return filepath
        return None
    except Exception as e:
        print(f"[Image {blog_id}] ✗ Error: {str(e)}")
        return None

def generate_featured_image_gemini(api_key, title, blog_id, category='entertainment', context=None):
    """Generate image with Gemini/Imagen-4 REST API using context"""
    try:
        import requests
        import base64
        import json
        
        print(f"[Image {blog_id}] Generating featured Imagen photo for {category} with context...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key={api_key}"
        
        # Use context summary if available
        context_prompt = f"Depicting: {context[:200]}..." if context else f"Topic: {title}"
        prompt = f"Hyper-realistic, 8k, ultra-detailed editorial photography for a {category} magazine cover. {context_prompt}. Professional lighting, masterpiece, ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO LOGOS, NO TYPOGRAPHY."
        payload = {
            "instances": [{"prompt": prompt}],
            "parameters": {"sampleCount": 1}
        }
        
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        if "predictions" in data and len(data["predictions"]) > 0:
            b64_image = data["predictions"][0]["bytesBase64Encoded"]
            img_data = base64.b64decode(b64_image)
            
            os.makedirs(GENERATED_IMG_DIR, exist_ok=True)
            filename = f"featured_{blog_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            filepath = os.path.join(GENERATED_IMG_DIR, filename)
            with open(filepath, 'wb') as f:
                f.write(img_data)
            return filepath
            
        print(f"[Image {blog_id}] Gemini REST failed to return predictions: {data}")
        return generate_placeholder_image(category, title, blog_id, "featured")
    except Exception as e:
        print(f"[Image {blog_id}] Gemini ✗ Error: {str(e)}")
        return generate_placeholder_image(category, title, blog_id, "featured")

def generate_placeholder_image(category, title, blog_id, type_prefix="featured"):
    """Returns a high-quality, category-aware Unsplash URL with high variety"""
    # Expanded pool of high-end editorial IDs from Unsplash
    specifics = {
        "tech": [
            "https://images.unsplash.com/photo-1518770660439-4636190af475",
            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa"
        ],
        "finance": [
            "https://images.unsplash.com/photo-1611974714028-ac6027a7d51b",
            "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
            "https://images.unsplash.com/photo-1579532566599-752049ee3a7a"
        ],
        "movies": [
            "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
            "https://images.unsplash.com/photo-1485846234645-a62644f84728",
            "https://images.unsplash.com/photo-1478720568477-152d9b164e26",
            "https://images.unsplash.com/photo-1517604101542-750721e905cc"
        ],
        "sports": [
            "https://images.unsplash.com/photo-1504450758481-7338ef7525e2",
            "https://images.unsplash.com/photo-1541252260730-0412e8e2108e",
            "https://images.unsplash.com/photo-1508098682722-e99c43a406b2",
            "https://images.unsplash.com/photo-1461896836934-ffe607ba8211"
        ],
        "health": [
            "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"
        ],
        "gaming": [
            "https://images.unsplash.com/photo-1542751371-adc38448a05e",
            "https://images.unsplash.com/photo-1511512578047-dfb367046420",
            "https://images.unsplash.com/photo-1538481199705-c710c4e965fc",
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f"
        ],
        "lifestyle": [
            "https://images.unsplash.com/photo-1502301103665-0b95cc738def",
            "https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e",
            "https://images.unsplash.com/photo-1505691938895-1758d7eaa511",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f"
        ],
        "science": [
            "https://images.unsplash.com/photo-1507413245164-6160d8298b31",
            "https://images.unsplash.com/photo-1532094349884-521990159491",
            "https://images.unsplash.com/photo-1518152006812-edab29b069ac",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa"
        ],
        "politics": [
            "https://images.unsplash.com/photo-1504173010664-32509bb9e1b0",
            "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620",
            "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81",
            "https://images.unsplash.com/photo-1524178232363-1fb2b075b655"
        ],
        "tv": [
            "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37",
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1",
            "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85"
        ],
        "music": [
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745",
            "https://images.unsplash.com/photo-1493225255756-d9584f8606e9"
        ],
        "celebrity": [
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
            "https://images.unsplash.com/photo-1514525253344-a812df99a86c",
            "https://images.unsplash.com/photo-1496337589254-7e19d01ced44"
        ],
        "streaming": [
            "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37",
            "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85",
            "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7"
        ],
        "books": [
            "https://images.unsplash.com/photo-1495446815901-a7297e633e8d",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794",
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6"
        ],
        "us_politics": [
            "https://images.unsplash.com/photo-1504173010664-32509bb9e1b0",
            "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620",
            "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81"
        ]
    }
    
    pool = specifics.get(category, specifics.get("tech"))
    base_url = random.choice(pool)
    
    # Use blog_id as part of the seed if possible to keep it stable for that post
    seed = f"{blog_id}_{random.randint(1, 1000)}"
    return f"{base_url}?auto=format&fit=crop&q=80&w=1200&seed={seed}"


def generate_detail_images(api_key, blog_id, title, category, num=3, context=None):
    """Generate supplemental detail photos for the article body with context"""
    import openai
    openai.api_key = api_key
    file_paths = []
    
    try:
        print(f"[Details {blog_id}] Generating {num} context-aware supplemental photos...")
        for i in range(num):
            # Use context to drive the detail shot
            context_prompt = f"Detailing: {context[:150]}..." if context else f"Topic: {title}"
            prompt = f"Detail shot for a {category} article. {context_prompt}. Macro photography, ultra-realistic, professional lighting, cinematic depth of field. Shot {i+1} of {num}. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO LOGOS, NO TYPOGRAPHY."
            response = openai.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            img_url = response.data[0].url
            img_data = requests.get(img_url, timeout=30)
            if img_data.status_code == 200:
                os.makedirs(GENERATED_IMG_DIR, exist_ok=True)
                filename = f"detail_{blog_id}_{i+1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                filepath = os.path.join(GENERATED_IMG_DIR, filename)
                with open(filepath, 'wb') as f:
                    f.write(img_data.content)
                file_paths.append(filepath)
        return file_paths
    except Exception as e:
        print(f"[Details {blog_id}] ✗ Error: {str(e)}")
        return file_paths

def generate_detail_images_gemini(api_key, blog_id, title, category, num=3, context=None):
    """Generate supplemental detail photos for the article body with Gemini/Imagen-4 using context"""
    file_paths = []
    try:
        import requests
        import base64
        import json
        
        print(f"[Details {blog_id}] Generating {num} context-aware supplemental photos with Gemini...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key={api_key}"
        
        for i in range(num):
            # Use context to drive the detail shot
            context_prompt = f"Detailing: {context[:150]}..." if context else f"Topic: {title}"
            prompt = f"Detail shot for a {category} article. {context_prompt}. Macro photography, ultra-realistic, professional lighting, cinematic depth of field. Shot {i+1} of {num}. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO LOGOS, NO TYPOGRAPHY."
            payload = {
                "instances": [{"prompt": prompt}],
                "parameters": {"sampleCount": 1}
            }
            
            try:
                response = requests.post(url, json=payload, timeout=60)
                response.raise_for_status()
                data = response.json()
                
                if "predictions" in data and len(data["predictions"]) > 0:
                    b64_image = data["predictions"][0]["bytesBase64Encoded"]
                    img_data = base64.b64decode(b64_image)
                    
                    os.makedirs(GENERATED_IMG_DIR, exist_ok=True)
                    filename = f"detail_{blog_id}_{i+1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    filepath = os.path.join(GENERATED_IMG_DIR, filename)
                    with open(filepath, 'wb') as f:
                        f.write(img_data)
                    file_paths.append(filepath)
                else:
                    print(f"[Details {blog_id}_{i}] Gemini REST returned no predictions.")
            except Exception as e:
                print(f"[Details {blog_id}_{i}] Gemini REST request failed: {e}")
                
    except Exception as e:
        print(f"[Details {blog_id}] Gemini ✗ Error: {str(e)}")
    return file_paths

# ============================================================================
# HTML GENERATION
# ============================================================================

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
        'tech': '#6366f1',
        'movies': '#e11d48',
        'tv': '#f43f5e',
        'music': '#a855f7',
        'celebrity': '#ec4899',
        'awards': '#f59e0b',
        'streaming': '#06b6d4',
        'books': '#8b5cf6',
        'finance': '#10b981',
        'health': '#22c55e',
        'science': '#3b82f6',
        'lifestyle': '#f97316',
        'gaming': '#6366f1',
        'sports': '#ef4444',
        'general': '#4f46e5'
    }
    accent_color = category_colors.get(category, '#4f46e5')
    
    # Convert markdown-style content to HTML
    formatted_content = content
    
    # 1. Pre-process Markdown Headers before paragraph wrapping
    formatted_content = re.sub(r'^###?\s*(.*)$', r'<h2>\1</h2>', formatted_content, flags=re.MULTILINE)
    formatted_content = re.sub(r'^##\s*(.*)$', r'<h2>\1</h2>', formatted_content, flags=re.MULTILINE)
    formatted_content = re.sub(r'^###\s*(.*)$', r'<h3>\1</h3>', formatted_content, flags=re.MULTILINE)
    
    # 2. Wrapping paragraphs
    if "<p>" not in formatted_content:
        paragraphs = formatted_content.split('\n\n')
        formatted_content = "".join([f"<p>{p.strip()}</p>" for p in paragraphs if p.strip()])
    
    # 3. Clean up Markdown Artifacts (Remove ** from headers)
    def clean_header(match):
        tag, content = match.groups()
        cleaned = content.replace('**', '').strip()
        return f'<{tag} class="editorial-{ "heading" if "2" in tag else "subheading"}">{cleaned}</{tag}>'

    formatted_content = re.sub(r'<(h[23])>(.*?)</\1>', clean_header, formatted_content, flags=re.DOTALL)
    
    # 4. Process Bolding in paragraphs
    formatted_content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', formatted_content)
    
    # 5. Inject more photos if markers exist
    if not detail_images:
        detail_images = []

    for i in range(1, 5):
        marker_regex = rf'(?:\*\*?)?\[?PHOTO{i}[^\]\n]*\]?(?:\*\*?)?'
        if re.search(marker_regex, formatted_content, flags=re.IGNORECASE):
            img_src = None
            # 1. Check if we have a specific image assigned for this slot
            if i-1 < len(detail_images) and detail_images[i-1]:
                d_img = detail_images[i-1]
                if d_img.startswith('http'):
                    img_src = d_img
                else:
                    img_src = f"/generated/{os.path.basename(d_img)}"
            
            # 2. Else generate a category-appropriate stable placeholder
            if not img_src:
                img_src = generate_placeholder_image(category, title, f"detail_{i}")
                
            formatted_content = re.sub(marker_regex, f'<div class="inline-photo"><img src="{img_src}" alt="Editorial Detail {i}"></div>', formatted_content, flags=re.IGNORECASE)
    
    # Style affiliate links as native recommendation cards
    def replace_affiliate_card(match):
        url, classes, img_url, title = match.groups()
        btn_text = "Get Access" if "sub-link" in classes else "Check Price"
        label = "Premium Access" if "sub-link" in classes else "Editor's Choice"
        img_html = f'<div class="rec-image"><img src="{img_url}" alt="{title}" style="max-width:100px; height:auto; object-fit:cover;"></div>' if img_url else ''
        return f'''<div class="product-recommendation {"subscription-card" if "sub-link" in classes else ""}">
                <div class="rec-label">{label}</div>
                <div class="rec-content-wrapper" style="display:flex; align-items:center; gap:2rem;">
                    {img_html}
                    <div class="rec-content" style="flex:1;">
                        <div class="rec-info">
                            <span class="rec-title">{title}</span>
                        </div>
                        <a href="{url}" target="_blank" class="rec-button" style="white-space:nowrap;">{btn_text}</a>
                    </div>
                </div>
            </div>'''

    formatted_content = re.sub(
        r'<a href="(.*?)" class="affiliate-link (.*?)"(?: data-img="(.*?)")?>(.*?)</a>',
        replace_affiliate_card,
        formatted_content
    )
    
    # 7. Safety Net: Resolve any MISSED markers that didn't become <a> tags
    # This ensures "unresolved ads" never reach the reader.
    links_pool = blog_data.get('affiliate_links', {})
    for i, link in enumerate(links_pool.get('clickbank', [])):
        marker = rf'\[?CB{i+1}\]?'
        if re.search(marker, formatted_content, flags=re.IGNORECASE):
            img_html = f'<div class="rec-image"><img src="{link.get("image","")}" alt="{link["title"]}" style="max-width:100px; height:auto; object-fit:cover;"></div>' if link.get("image") else ''
            card = f'''<div class="product-recommendation"><div class="rec-label">Editor's Choice</div><div class="rec-content-wrapper" style="display:flex; align-items:center; gap:2rem;">{img_html}<div class="rec-content" style="flex:1;"><div class="rec-info"><span class="rec-title">{link["title"]}</span></div><a href="{link["url"]}" target="_blank" class="rec-button" style="white-space:nowrap;">Check Price</a></div></div></div>'''
            formatted_content = re.sub(marker, card, formatted_content, flags=re.IGNORECASE)

    for i, link in enumerate(links_pool.get('amazon', [])):
        marker = rf'\[?AMZ{i+1}\]?'
        if re.search(marker, formatted_content, flags=re.IGNORECASE):
            img_html = f'<div class="rec-image"><img src="{link.get("image","")}" alt="{link["title"]}" style="max-width:100px; height:auto; object-fit:cover;"></div>' if link.get("image") else ''
            card = f'''<div class="product-recommendation"><div class="rec-label">Community Pick</div><div class="rec-content-wrapper" style="display:flex; align-items:center; gap:2rem;">{img_html}<div class="rec-content" style="flex:1;"><div class="rec-info"><span class="rec-title">{link["title"]}</span></div><a href="{link["url"]}" target="_blank" class="rec-button" style="white-space:nowrap;">Check Price</a></div></div></div>'''
            formatted_content = re.sub(marker, card, formatted_content, flags=re.IGNORECASE)

    # 8. Unresolved Photos Fallback
    for i in range(1, 6):
        marker = rf'\[?PHOTO{i}[^\]]*\]?'
        if re.search(marker, formatted_content, flags=re.IGNORECASE):
            fallback_img = generate_placeholder_image(category, title, f"fallback_{i}")
            formatted_content = re.sub(marker, f'<div class="inline-photo"><img src="{fallback_img}" alt="Editorial Detail {i}"></div>', formatted_content, flags=re.IGNORECASE)

    # 9. Final Artifact Scrub (Remove any raw ** or __ or patterns like "Title: ...")
    formatted_content = re.sub(r'^(?:\*\*)?Title:.*?\n', '', formatted_content, flags=re.IGNORECASE | re.MULTILINE)
    formatted_content = re.sub(r'^(?:\*\*)?Headline:.*?\n', '', formatted_content, flags=re.IGNORECASE | re.MULTILINE)
    formatted_content = formatted_content.replace('**', '').replace('__', '')

    img_html = ''
    if featured_image:
        if featured_image.startswith('http'):
            img_html = f'<div class="hero-image-container"><img src="{featured_image}" class="hero-image" alt="{title}"></div>'
        else:
            feat_name = os.path.basename(featured_image)
            img_html = f'<div class="hero-image-container"><img src="/generated/{feat_name}" class="hero-image" alt="{title}"></div>'
    else:
        # Final fallback for articles with absolutely no image data
        fallback = f"https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=1200"
        img_html = f'<div class="hero-image-container"><img src="{fallback}" class="hero-image" alt="{title}"></div>'

    # Determine base URL (thread-safe fallback)
    try:
        from flask import has_request_context, request
        if has_request_context():
            base_url = request.host_url.rstrip('/')
        else:
            # Fallback for background threads
            # In a real prod env, this would be a config var
            # Use config value if set, else fallback
            _cfg = load_config()
            base_url = _cfg.get('public_base_url', "http://localhost:5050").rstrip('/')
    except:
        base_url = "http://localhost:5050"

    meta_description = re.sub(r'<.*?>', '', formatted_content)[:160].replace('"', "'")
    post_slug = title.lower().replace(' ', '-')
    canonical_url = f"{base_url}/post/{blog_data.get('filename', post_slug + '.html')}"
    publish_date = datetime.now().strftime('%Y-%m-%dT%H:%M:%S+00:00')

    # Ensure image URL is handled correctly for JSON-LD (local vs external)
    image_url = f"{base_url}/assets/banner.jpg"
    if featured_image:
        if featured_image.startswith('http'):
            image_url = featured_image
        else:
            image_url = f"{base_url}/generated/{os.path.basename(featured_image)}"

    # SEO SCHEMA (JSON-LD)
    schema_json = json.dumps({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title.replace('**', '').replace('"', "'"),
        "image": [image_url],
        "datePublished": publish_date,
        "dateModified": publish_date,
        "author": [{
            "@type": "Person",
            "name": writer_name,
            "jobTitle": writer_title,
            "url": base_url
        }],
        "publisher": {
            "@type": "Organization",
            "name": "KnotStranded Media Intelligence",
            "logo": {
                "@type": "ImageObject",
                "url": f"{base_url}/assets/logo.png"
            }
        },
        "description": meta_description,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical_url
        }
    })

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | KnotStranded Media</title>
    <meta name="description" content="{meta_description}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <link rel="canonical" href="{canonical_url}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,900&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {schema_json}
    </script>
    <style>
        :root {{
            --primary: #4f46e5;
            --bg-body: #0a0a0a;
            --bg-card: #141414;
            --text-main: #ffffff;
            --text-body: #bbbbbb;
            --max-width: 800px;
            --border: #222222;
            --accent: {accent_color};
        }}
        
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--bg-body);
            color: var(--text-main);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }}

        /* Header / Nav Area */
        .site-nav {{
            padding: 3rem 2rem;
            display: flex;
            justify-content: center;
            border-bottom: 1px solid var(--border);
            margin-bottom: 6rem;
            background: var(--bg-body);
        }}
        .site-logo {{
            font-family: 'Fraunces', serif;
            font-weight: 900;
            font-size: 2.5rem;
            text-decoration: none;
            color: #fff;
            letter-spacing: -2px;
        }}

        /* Main Article Layout */
        .article-header {{
            max-width: 900px;
            margin: 0 auto 4rem;
            padding: 0 2rem;
            text-align: center;
        }}

        .kicker {{
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--accent);
            margin-bottom: 1.5rem;
        }}

        h1 {{
            font-family: 'Fraunces', serif;
            font-size: clamp(2.5rem, 8vw, 4.5rem);
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: -2px;
            margin-bottom: 3rem;
            color: #fff;
            text-align: center;
        }}

        .author-meta {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
            font-size: 13px;
            font-weight: 600;
            color: #666;
        }}
        .author-meta span {{ color: var(--primary); font-weight: 800; }}

        .hero-image-container {{
            max-width: 1200px;
            margin: 0 auto 5rem;
            padding: 0 2rem;
        }}
        .hero-image {{
            width: 100%;
            height: auto;
            border-radius: 4px;
            border: 1px solid var(--border);
        }}

        .article-content {{
            max-width: var(--max-width);
            margin: 0 auto;
            padding: 0 2rem;
            font-family: 'Inter', sans-serif;
            font-size: 1.25rem;
            color: var(--text-body);
            line-height: 1.8;
        }}

        .article-content p {{ margin-bottom: 2.5rem; }}

        .editorial-heading {{
            font-family: 'Fraunces', serif;
            font-size: 2.75rem;
            font-weight: 900;
            margin: 6rem 0 3rem;
            line-height: 1.1;
            letter-spacing: -2px;
            color: #fff;
            border-left: 4px solid var(--accent);
            padding-left: 1.5rem;
        }}

        .editorial-subheading {{
            font-family: 'Fraunces', serif;
            font-size: 1.85rem;
            font-weight: 800;
            margin: 4rem 0 2rem;
            color: #eee;
            letter-spacing: -0.5px;
        }}

        .inline-photo {{
            margin: 5rem 0;
            width: 100%;
        }}
        .inline-photo img {{
            width: 100%;
            height: auto;
            border-radius: 4px;
            border: 1px solid var(--border);
        }}

        /* High-End Affiliate Callouts */
        .product-recommendation {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            margin: 5rem 0;
            padding: 3rem;
            position: relative;
        }}
        .rec-label {{
            position: absolute;
            top: -12px;
            left: 24px;
            background: #000;
            color: #fff;
            padding: 4px 12px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }}
        .rec-content {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 2rem;
        }}
        .rec-info .rec-title {{
            font-family: 'Fraunces', serif;
            font-size: 1.5rem;
            font-weight: 900;
            color: #fff;
        }}
        .rec-button {{
            background: #000;
            color: #fff;
            text-decoration: none;
            padding: 12px 24px;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            transition: transform 0.2s;
        }}
        .rec-button:hover {{ background: var(--primary); color: #fff; transform: translateY(-2px); }}

        .subscription-card {{
            background: #1a1c2e;
            border-color: #4f46e5;
        }}
        .subscription-card .rec-label {{ background: #4f46e5; }}
        .subscription-card .rec-button {{ background: #4f46e5; color: #fff; }}

        /* Author Bio Block */
        .author-card {{
            max-width: var(--max-width);
            margin: 8rem auto;
            padding: 4rem 2rem;
            border-top: 1px solid var(--border);
            display: flex;
            gap: 2rem;
            align-items: flex-start;
        }}
        .author-avatar {{
            width: 80px;
            height: 80px;
            background: var(--primary);
            color: #fff;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Fraunces', serif;
            font-size: 2rem;
            font-weight: 900;
            flex-shrink: 0;
        }}
        .author-info h4 {{ font-size: 14px; font-weight: 900; text-transform: uppercase; margin-bottom: 1rem; color: #fff; }}
        .author-info p {{ font-size: 16px; color: var(--text-body); line-height: 1.6; }}

        /* Responsive */
        @media (max-width: 640px) {{
            h1 {{ font-size: 3rem; letter-spacing: -2px; }}
            .rec-content {{ flex-direction: column; align-items: flex-start; gap: 1rem; }}
        }}
    </style>
</head>
<body>
    <nav class="site-nav"><a href="/" class="site-logo">KnotStranded Media</a></nav>

    <article>
        <header class="article-header">
            <div class="kicker">Viral Intelligence Report</div>
            <h1>{title}</h1>
            <div class="author-meta">
                <span>{writer_name}</span> &centerdot; {publish_date or datetime.now().strftime('%B %d, %Y')} &centerdot; 5 min read
            </div>
        </header>

        {img_html}

        <div class="article-content">
            {formatted_content}
        </div>

        <section class="author-card">
            <div class="author-avatar" style="background: var(--primary);"><img src="/static/avatars/writer_{writer.get('id', 1)}.jpg" alt="{writer_name}" onerror="this.parentElement.innerHTML='{writer_name[0]}'; this.parentElement.style.fontSize='2rem'; this.parentElement.style.fontWeight='900'; this.parentElement.style.color='#fff';" style="width:100%;height:100%;object-fit:cover;border-radius:4px;"></div>
            <div class="author-info">
                <h4>Written by {writer_name}</h4>
                <p>{writer_bio}</p>
                <div style="margin-top: 1rem; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #555;">Published: {datetime.now().strftime('%B %d, %Y')}</div>
            </div>
        </section>
    </article>

    <footer style="padding: 10rem 2rem; text-align: center; background: #050505; border-top: 1px solid #222;">
        <div class="site-logo" style="margin-bottom: 1.5rem; color: #fff;">KnotStranded Media</div>
        <p style="font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 0.1em;">© 2026 Viral Intelligence Group. All rights reserved.</p>
    </footer>
</body>
</html>"""
    return html

# ============================================================================
# RETRY LOGIC
# ============================================================================

def search_with_retry(config, max_retries=2):
    """Search with retry"""
    provider = config.get('ai_provider', 'claude').lower()
    num = int(config.get('num_articles', 5))
    query = config.get('query_filter', '')
    cats = config.get('selected_categories', ['movies', 'tv'])
    print(f"[Search Engine] Provider: {provider} | Requested Articles: {num}")
    
    for attempt in range(max_retries):
        try:
            return search_with_rss(num, query, cats, config)
        except Exception as e:
            print(f"[Search Retry] Attempt {attempt+1} failed: {str(e)}")
            if attempt < max_retries - 1:
                import time
                time.sleep(2)
            else:
                return [], f"Search failed after retries: {str(e)}"

# ============================================================================
# DUPLICATE PREVENTION SYSTEM
# ============================================================================

def get_recent_history(days=7):
    """Scan generated posts from the last N days to build a topic database"""
    history = []
    if not os.path.exists(POSTS_DIR):
        return []
        
    cutoff = datetime.now() - timedelta(days=days)
    
    for filename in os.listdir(POSTS_DIR):
        if filename.endswith('.html'):
            filepath = os.path.join(POSTS_DIR, filename)
            try:
                mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
            except:
                mtime = datetime.now()
            
            if mtime > cutoff:
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        title_match = re.search(r'<h1>(.*?)</h1>', content)
                        if title_match:
                            history.append({
                                'title': title_match.group(1).lower(),
                                'date': mtime
                            })
                except:
                    continue
    return history

def is_duplicate_subject(new_title, history):
    """
    Checks if a new title overlaps significantly with recent history.
    Uses basic keyword overlap (excluding common stop words).
    """
    new_title = new_title.lower()
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'is', 'are', 'was', 'were', 'new', 'latest', 'recent', 'exclusive'}
    
    new_words = set(re.findall(r'\w+', new_title)) - stop_words
    
    if len(new_words) < 2: return False # Title too short to reliably check
    
    for record in history:
        old_words = set(re.findall(r'\w+', record['title'])) - stop_words
        overlap = new_words.intersection(old_words)
        
        # If 60% of keywords match, it's probably the same subject
        if len(overlap) >= (len(new_words) * 0.6):
            return True
            
    return False

# ── Category helpers ──────────────────────────────────────────────────────────

CAT_KEYWORD_MAP = {
    cat: data['keywords']
    for cat, data in NEWS_CATEGORIES.items()
}

def resolve_category(raw_cat: str) -> str:
    """Return a valid NEWS_CATEGORIES key for any incoming category string.
    Matches exact key first, then checks if any NEWS_CATEGORIES keyword
    appears in the raw value, then falls back to 'movies'."""
    if not raw_cat:
        return 'movies'
    raw_lower = raw_cat.lower().strip()
    # Exact key match
    if raw_lower in NEWS_CATEGORIES:
        return raw_lower
    # Partial match — e.g. 'entertainment' → 'movies'
    for cat, keywords in CAT_KEYWORD_MAP.items():
        if any(kw in raw_lower for kw in keywords):
            return cat
        if raw_lower in cat or cat in raw_lower:
            return cat
    return 'movies'


def detect_category_from_content(title: str, content: str) -> str:
    """Detect the best category by scoring keyword matches against title + content."""
    text = (title + ' ' + content[:2000]).lower()
    scores = {}
    for cat, keywords in CAT_KEYWORD_MAP.items():
        scores[cat] = sum(text.count(kw) for kw in keywords)
    # Return the highest scoring category, or 'movies' if no match
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else 'movies'


# LANDING_INDEX_FILE defined at top via DATA_DIR

def load_landing_index():
    """Load the cached landing page post index."""
    if os.path.exists(LANDING_INDEX_FILE):
        try:
            with open(LANDING_INDEX_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_landing_index(posts):
    """Persist the landing page post index to disk."""
    try:
        with open(LANDING_INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(posts, f, indent=2)
    except Exception as e:
        print(f"[Landing Index] Failed to save: {e}")

def index_post(filename, title, date, img, category):
    """Add or update a single post entry in the landing index."""
    index = load_landing_index()
    # Remove existing entry for this filename (avoid duplicates)
    index = [p for p in index if p.get('filename') != filename]
    cat_name = NEWS_CATEGORIES.get(category, {}).get('name', category.title())
    try:
        mtime = os.path.getmtime(os.path.join(POSTS_DIR, filename)) if os.path.exists(os.path.join(POSTS_DIR, filename)) else time.time()
    except:
        mtime = time.time()
    index.append({
        'filename': filename,
        'title': title,
        'date': date,
        'img': img,
        'category': category,
        'category_name': cat_name,
        'mtime': mtime,
    })
    # Keep sorted newest-first
    index.sort(key=lambda p: p.get('mtime', 0), reverse=True)
    save_landing_index(index)
    return index

def get_posts_for_landing():
    """
    Scan generated_posts/ and return (latest_posts, posts_by_category).

    - latest_posts: always the 10 most recently generated posts, regardless of
      publish date. These power the hero and Top Stories sidebar and are never
      gated by a time window, so the homepage is never empty.
    - posts_by_category: all posts bucketed as active (<48 h) or archived.
    """
    posts_by_category = {cat: {'active': [], 'archived': []} for cat in NEWS_CATEGORIES.keys()}
    all_posts = []
    recent_threshold = 48 * 3600   # posts within 48 h appear as 'active' in category sections
    now_ts = time.time()

    if not os.path.exists(POSTS_DIR):
        return [], posts_by_category

    # Prefer the fast cached index; fall back to full scan
    index = load_landing_index()
    if not index:
        # Full scan — build index on the fly
        def safe_mtime(f):
            try: return os.path.getmtime(os.path.join(POSTS_DIR, f))
            except: return 0

        filenames = sorted(
            [f for f in os.listdir(POSTS_DIR) if f.endswith('.html')],
            key=safe_mtime,
            reverse=True
        )
        for filename in filenames:
            filepath = os.path.join(POSTS_DIR, filename)
            try:
                mtime = os.path.getmtime(filepath)
                with open(filepath, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                title_m = re.search(r'<h1>(.*?)</h1>', content)
                title   = title_m.group(1) if title_m else filename
                date_m  = re.search(r'• (.*?)</p>', content)
                date    = date_m.group(1) if date_m else 'Recent'
                img_m   = re.search(r'src="(?:/)?(static/img/.*?|generated/.*?|https://images\.unsplash\.com/.*?)"', content)
                img     = img_m.group(1) if img_m else None
                if img and not img.startswith('http') and not img.startswith('/'):
                    img = '/' + img
                cat     = 'movies'
                # 1. Check for an embedded category comment written at generation time
                cat_comment = re.search(r'<!--\s*category:([\w_]+)\s*-->', content)
                if cat_comment and cat_comment.group(1) in NEWS_CATEGORIES:
                    cat = cat_comment.group(1)
                else:
                    # 2. Score keywords in title + body to detect category
                    cat = detect_category_from_content(title, content)
                index.append({
                    'filename': filename,
                    'title': title,
                    'date': date,
                    'img': img,
                    'category': cat,
                    'category_name': NEWS_CATEGORIES[cat]['name'],
                    'mtime': mtime,
                })
            except Exception:
                continue
        # Persist for next time
        save_landing_index(index)

    # Build post list from index (already sorted newest-first)
    for entry in index:
        # Verify file still exists (user might have deleted it)
        filepath = os.path.join(POSTS_DIR, entry['filename'])
        if not os.path.exists(filepath):
            continue
        mtime = entry.get('mtime', 0)
        age   = now_ts - mtime
        cat   = entry.get('category', 'movies')
        if cat not in posts_by_category:
            cat = 'movies'
        post_data = {
            'filename':      entry['filename'],
            'title':         entry['title'],
            'date':          entry['date'],
            'img':           entry['img'],
            'category':      cat,
            'category_name': entry.get('category_name', NEWS_CATEGORIES[cat]['name']),
        }
        all_posts.append(post_data)
        if age <= recent_threshold:
            posts_by_category[cat]['active'].append(post_data)
        else:
            posts_by_category[cat]['archived'].append(post_data)

    # Top Stories = always the freshest 10 stories (index is sorted newest-first)
    latest_posts = all_posts[:10]

    return latest_posts, posts_by_category

# ============================================================================
# AUTO-PILOT SCHEDULER (Daily Updates)
# ============================================================================

MAX_ARTICLES_PER_RUN = 2  # Hard cap: generate at most this many articles per run
# PENDING_POSTS_FILE defined at top via DATA_DIR


def load_pending_posts():
    """Load the queue of articles waiting to be published at release time."""
    if os.path.exists(PENDING_POSTS_FILE):
        try:
            with open(PENDING_POSTS_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return []


def save_pending_posts(posts):
    with open(PENDING_POSTS_FILE, 'w') as f:
        json.dump(posts, f, indent=2)


def auto_pilot_worker():
    """
    Background scheduler for automated blog posting.
    Generates up to MAX_ARTICLES_PER_RUN (2) articles per run, which are instantly posted locally.
    
    auto_pilot_generate_hour (int, default 5) — when to generate
    """
    print("\n[Auto-Pilot] Scheduler initialized.")

    last_generate_date = None

    while True:
        try:
            now    = datetime.now()
            today  = now.date()
            config = load_config()

            if config.get('auto_pilot') != 'enabled':
                time.sleep(60)
                continue

            gen_hour = int(config.get('auto_pilot_generate_hour', 5))

            if now.hour == gen_hour and last_generate_date != today:
                last_generate_date = today
                print(f"\n[Auto-Pilot] {now.strftime('%H:%M')} — Generation phase starting (max {MAX_ARTICLES_PER_RUN} articles)")

                run_cats = config.get('selected_categories', list(NEWS_CATEGORIES.keys()))
                provider = config.get('ai_provider', 'claude')
                
                items, err = search_with_google_trends(
                    MAX_ARTICLES_PER_RUN * 3, "", run_cats, config
                )

                if err or not items:
                    print(f"[Auto-Pilot] ✗ Search failed: {err}")
                else:
                    history = get_recent_history(days=7)
                    fresh = [
                        it for it in items
                        if not is_duplicate_subject(it['title'], history)
                    ]
                    if not fresh:
                        print("[Auto-Pilot] All found articles already covered recently — skipping.")
                    else:
                        to_generate = fresh[:MAX_ARTICLES_PER_RUN]
                        print(f"[Auto-Pilot] Generating {len(to_generate)} article(s)…")

                        generation_state['news_items'] = to_generate
                        generation_worker(config, [it['id'] for it in to_generate])
                        
                        print(f"[Auto-Pilot] ✓ Successfully generated and published {len(to_generate)} articles to local site.")

        except Exception as exc:
            print(f"[Auto-Pilot] Scheduler error: {exc}")

        time.sleep(60)

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
    'posting_status': {}, # filename: {success, url, error}
    'error': None,
    'ai_used': None,
    'current_step': 'idle'
}

# Shared live log — appended to during generation, polled by the dashboard
generation_log = []   # list of {ts, msg, level}  level = info|ok|err|writing
MAX_LOG_LINES = 200

def log_gen(msg: str, level: str = 'info'):
    """Append a line to the live generation log and print it."""
    from datetime import datetime as _dt
    entry = {'ts': _dt.now().strftime('%H:%M:%S'), 'msg': msg, 'level': level}
    generation_log.append(entry)
    if len(generation_log) > MAX_LOG_LINES:
        generation_log.pop(0)
    print(f"[Gen] {msg}")

def load_subscribers():
    if os.path.exists(SUBSCRIBERS_FILE):
        with open(SUBSCRIBERS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_subscribers(subs):
    with open(SUBSCRIBERS_FILE, 'w') as f:
        json.dump(subs, f, indent=2)

def send_demo_email(to_email, subject, body):
    """Placeholder for real email sending logic (SendGrid/SMTP)"""
    print(f"\n[EMAIL SIMULATOR] To: {to_email}")
    print(f"[EMAIL SIMULATOR] Subject: {subject}")
    print(f"[EMAIL SIMULATOR] Content: {body[:100]}...")
    return True

# Multi-generation control
worker_serial = 0
global_worker_lock = threading.Lock()

def generation_worker(config, selected_ids):
    """Background generation - Simplified Sequential Core V3"""
    global generation_state, worker_serial
    
    
    with global_worker_lock:
        worker_serial += 1
        my_serial = worker_serial
    
    try:
        log_gen("Starting pipeline V3 (Sequential)...", "info")
        
        # Capability Assessment
        target_words = int(config.get('word_count', 500))
        provider = config.get('ai_provider', 'claude')
        
        log_gen(f"🔍 Capability Assessment: Validating {provider.title()} credentials...", "info")
        missing_keys = []
        if provider == 'claude' and not config.get('anthropic_api_key'): missing_keys.append("Anthropic API Key")
        if provider == 'gemini' and not config.get('gemini_api_key'): missing_keys.append("Gemini API Key")
        if provider == 'chatgpt' and not config.get('openai_api_key'): missing_keys.append("OpenAI API Key")
        
        if missing_keys:
            err = f"Missing credentials: {', '.join(missing_keys)}. Fix in Settings."
            generation_state['status'] = 'error'
            generation_state['error'] = err
            log_gen(f"❌ Aborted: {err}", "err")
            return

        if target_words > 1200:
            log_gen(f"⚠️ High word count ({target_words}) requested. This increases timeout risks.", "info")

        generation_state['progress'] = 0
        generation_state['error'] = None
        generation_state['generated_files'] = []
        
        items = [item for item in generation_state.get('news_items', []) if item['id'] in selected_ids]
        if not items:
            generation_state['status'] = 'error'
            err = "No articles found in current session selection."
            generation_state['error'] = err
            log_gen(f"❌ Error: {err}", "err")
            return
            
        generation_state['status'] = 'generating'
        generation_state['total'] = len(items)
        generation_state['ai_used'] = provider.title()
        generation_log.clear()
        
        log_gen(f'▶ Queue: {len(items)} articles using {provider.title()} (~{target_words} words each)', 'info')
        os.makedirs(POSTS_DIR, exist_ok=True)
        
        # Linearly process each article.
        for idx, news_item in enumerate(items, 1):
            # Cancellation check
            if my_serial != worker_serial:
                log_gen("🛑 Process superseded by new generation task.", "info")
                return

            # Update status for UI
            generation_state['progress'] = idx
            generation_state['current_article'] = news_item['title']
            generation_state['current_step'] = 'crawl'
            
            log_gen(f'[{idx}/{len(items)}] Writing: {news_item["title"][:70]}...', 'info')
            
            # 1. Preparations
            writer = select_random_writer()
            category = news_item.get('category', 'general')
            
            # 2. Context Collection (Crawl)
            try:
                log_gen(f'  - Fetching full article content for context...', 'info')
                full_text = crawl_full_article(news_item['link'])
                if full_text:
                    news_item['full_context'] = full_text
                    log_gen(f'  ✓ Context retrieved ({len(full_text.split())} words)', 'ok')
                else:
                    log_gen('  ⚠️ Crawl failed, falling back to snippet.', 'info')
            except Exception as crawl_e:
                log_gen(f'  ⚠️ Crawl error: {crawl_e}', 'info')

            # 3. Context-Aware Affiliate Link Selection (from Pool)
            # We get a larger pool and let the AI decide on placement
            links = get_affiliate_links(category, context=news_item.get('full_context'))

            # 3. Generation (with retry inside)
            try:
                log_gen(f'  - Requesting {target_words} words from {provider.title()}...', 'writing')
                generation_state['current_step'] = 'writing'
                blog_result = generate_blog_with_retry(config, news_item, writer, links)
                
                if not blog_result or not blog_result.get('content'):
                    raise Exception("AI returned empty content")
                
                log_gen(f'  ✓ Text generated ({len(blog_result.get("content","").split())} words)', 'ok')
                
                # 3. Images (Non-blocking / Soft-fail)
                featured_image = None
                detail_images = []
                try:
                    log_gen('  - Generating imagery...', 'info')
                    generation_state['current_step'] = 'imagery'
                    img_engine = config.get('image_provider', 'auto')
                    
                    if img_engine == 'none':
                        log_gen('  - Skipping AI imagery per settings.', 'info')
                    elif img_engine == 'gemini' and config.get('gemini_api_key'):
                        featured_image = generate_featured_image_gemini(config['gemini_api_key'], blog_result['title'], news_item['id'], category, context=blog_result.get('content'))
                        detail_images = generate_detail_images_gemini(config['gemini_api_key'], news_item['id'], blog_result['title'], category, context=blog_result.get('content'))
                    elif img_engine == 'openai' and config.get('openai_api_key'):
                        featured_image = generate_featured_image(config['openai_api_key'], blog_result['title'], news_item['id'], category, context=blog_result.get('content'))
                        detail_images = generate_detail_images(config['openai_api_key'], news_item['id'], blog_result['title'], category, num=2, context=blog_result.get('content'))
                    else:
                        # Auto-prioritize (Default behavior)
                        if config.get('gemini_api_key'):
                            featured_image = generate_featured_image_gemini(config['gemini_api_key'], blog_result['title'], news_item['id'], category, context=blog_result.get('content'))
                            detail_images = generate_detail_images_gemini(config['gemini_api_key'], news_item['id'], blog_result['title'], category, context=blog_result.get('content'))
                        elif config.get('openai_api_key'):
                            featured_image = generate_featured_image(config['openai_api_key'], blog_result['title'], news_item['id'], category, context=blog_result.get('content'))
                            detail_images = generate_detail_images(config['openai_api_key'], news_item['id'], blog_result['title'], category, num=2, context=blog_result.get('content'))
                except Exception as img_e:
                    log_gen(f'  ⚠️ Image AI failed: {str(img_e)[:50]}... using fallback.', 'info')
                    featured_image = generate_placeholder_image(category, blog_result['title'], news_item['id'])
                    detail_images = [generate_placeholder_image(category, blog_result['title'], news_item['id'], "detail")]
                
                # 4. Final Assembly
                p_date = datetime.now().strftime('%B %d, %Y')
                html = create_styled_html(blog_result, news_item, provider.title(), featured_image, detail_images, publish_date=p_date)
                tags = generate_tags(category)
                html = f'<!-- category:{category} -->\n' + html

                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"blog_{news_item['id']}_{timestamp}.html"
                filepath = os.path.join(POSTS_DIR, filename)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(html)
                
                # 5. Indexing
                # Index the first image found (local or remote)
                generation_state['current_step'] = 'save'
                img_m = re.search(r'src="(?:/)?(static/img/.*?|generated/.*?|https://images\.unsplash\.com/.*?)"', html)
                post_img = '/' + img_m.group(1) if img_m and not img_m.group(1).startswith('http') else (img_m.group(1) if img_m else None)
                date_m = re.search(r'&centerdot; (.*?) &centerdot;', html)
                post_date = date_m.group(1) if date_m else datetime.now().strftime('%B %d, %Y')
                index_post(filename, blog_result['title'], post_date, post_img, category)
                
                generation_state['generated_files'].append({
                    'filename': filename, 'title': blog_result['title'], 'writer': writer['name']
                })
                
                log_gen(f'  ✅ Saved and Indexed!', 'ok')
                
            except Exception as e:
                err_str = str(e).lower()
                log_gen(f'  ❌ Error: {str(e)[:100]}', 'err')
                if 'rate' in err_str or 'quota' in err_str:
                    log_gen('  ⏸ Rate limit hit. Pausing 60s...', 'info')
                    time.sleep(60)

            # Pause between articles to survive free tiers
            if idx < len(items):
                log_gen('⏳ Cooling down 20s...', 'info')
                time.sleep(20)

        # Final Wrap
        if my_serial == worker_serial:
            generation_state['status'] = 'complete'
            log_gen(f'🎉 All {len(items)} articles processed.', 'ok')
            
    except Exception as e:
        log_gen(f"💥 Pipeline Failure: {str(e)}", "err")
        generation_state['status'] = 'error'
        generation_state['error'] = str(e)
        print(f"{'='*60}\n")

        # ── Auto-update homepage after generation ──────────────────────────
        # Always rebuild the landing index so the live home() route reflects
        # the new posts immediately (index_post() was already called per-article,
        # but a full rescan ensures ordering and image paths are correct).
        try:
            save_landing_index([])          # force full rescan
            get_posts_for_landing()         # rebuilds + persists the index
            print("[Homepage] Landing index refreshed with new articles.")
        except Exception as idx_err:
            print(f"[Homepage] Index refresh failed: {idx_err}")

        # Only rebuild static files if the config flag is set
        if config.get('auto_update_homepage') == 'enabled':
            print("[Homepage] Auto-update enabled — rebuilding static site...")
            build_static_site()
        else:
            # Always do the fast in-memory rebuild regardless (serves live Flask routes)
            build_static_site()
        
    except Exception as e:
        generation_state['status'] = 'error'
        generation_state['error'] = str(e)
        print(f"\n✗ Error: {str(e)}\n")


@app.route('/api/stop-generation', methods=['POST'])
@login_required
def stop_generation_api():
    """Immediately halts the current generation worker by incrementing global serial."""
    global worker_serial, generation_state
    with global_worker_lock:
        worker_serial += 1
    
    generation_state['status'] = 'idle'
    generation_state['error'] = "Generation cancelled by operator."
    generation_state['current_article'] = ""
    log_gen("🛑 Pipeline termination requested. Stopping immediately...", "err")
    
    return jsonify({'status': 'stopped'})


def reprocess_and_heal_all_posts():
    """
    Iterates through all posts in knot_storage, fixes placeholders, 
    generates missing images, and ensures affiliate links are valid.
    """
    # Use the existing get_posts_for_landing to scan everything
    save_landing_index([]) # force rescan
    get_posts_for_landing() # this builds the index
    posts = load_landing_index() # this gets EVERYTHING (all 26+ posts)
    config = load_config()
    gemini_key = config.get('gemini_api_key') or os.environ.get('GEMINI_API_KEY')
    
    healed_count = 0
    img_count = 0
    
    print(f"[*] Heal: Scanning {len(posts)} articles for corrections...")

    # Process newest first
    for p in posts:
        filepath = os.path.join(POSTS_DIR, p['filename'])
        if not os.path.exists(filepath): continue
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            updated = False
            cat = p.get('category', 'tech')
            title = p.get('title', 'Editorial Report')
            blog_id = p['filename'].replace('.html', '')
            
            # 1. Healing Featured Image
            featured_img = p.get('img')
            # Look for Unsplash placeholders or missing images
            if not featured_img or "images.unsplash.com" in str(featured_img) or "placeholder" in str(featured_img):
                if gemini_key:
                    print(f"[*] Heal: Generating featured image for '{title}'...")
                    new_img_path = generate_featured_image_gemini(gemini_key, title, blog_id, cat)
                    if new_img_path and "featured_" in new_img_path:
                        rel_img = "/generated/" + os.path.basename(new_img_path)
                        if featured_img:
                            content = content.replace(featured_img, rel_img)
                        else:
                            # Try to find a good spot after meta or header
                            content = re.sub(r'(</header>)', f'\\1\n\n<div class="hero-image-container"><img src="{rel_img}" class="hero-image" alt="{title}"></div>', content)
                        updated = True
                        img_count += 1

            # 2. Healing YOURVENDOR in content
            if "YOURVENDOR" in content:
                print(f"[*] Heal: Resolving YOURVENDOR placeholders in '{title}'...")
                links = get_affiliate_links(cat)
                if links['clickbank']:
                    m = re.search(r'https?://([^.]+)\.hop\.clickbank\.net', links['clickbank'][0]['url'])
                    if m:
                        actual_vendor = m.group(1)
                        content = content.replace("YOURVENDOR", actual_vendor)
                        updated = True

            # 3. Fixing Amazon Search Links
            if "amazon.com/s?k=" in content:
                content = re.sub(r'amazon\.com/s\?k=([^"& ]+)', r'amazon.com/gp/search?keywords=\1', content)
                updated = True

            # 4. Supplemental Photo Healing
            if "[PHOTO1]" in content or "[PHOTO2]" in content or "[PHOTO3]" in content:
                if gemini_key:
                    print(f"[*] Heal: Generating supplemental photos for '{title}'...")
                    details = generate_detail_images_gemini(gemini_key, blog_id, title, cat, num=3)
                    for i, d_url in enumerate(details):
                        p_tag = f"[PHOTO{i+1}]"
                        if p_tag in content:
                            content = content.replace(p_tag, f'<div class="inline-photo"><img src="{d_url}" alt="Editorial Detail {i+1}"></div>')
                            updated = True
                            img_count += 1

            # 5. Fixing l4j4n if changed
            target_id = config.get('clickbank_affiliate_id', 'l4j4n')
            if 'affiliate=l4j4n' in content and target_id != 'l4j4n':
                content = content.replace('affiliate=l4j4n', f'affiliate={target_id}')
                updated = True

            if updated:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                healed_count += 1
                
        except Exception as e:
            print(f"[!] Error healing {p['filename']}: {e}")
            
    print(f"[*] Heal: Done. {healed_count} posts corrected, {img_count} images created.")
    return healed_count, img_count

def build_static_site():
    """Builds the entire site into a flat static HTML folder"""
    print("[*] Generating static site...")
    try:
        os.makedirs(STATIC_SITE_DIR, exist_ok=True)
        os.makedirs(os.path.join(STATIC_SITE_DIR, 'post'), exist_ok=True)
        # We need a request context to render templates
        with app.test_request_context('/'):
            latest_posts, posts_by_category = get_posts_for_landing()

            ads = get_affiliate_links("default", num_cb=2, num_amz=1, num_sub=2)
            html = render_template('landing.html',
                                   latest_posts=latest_posts,
                                   categories=posts_by_category,
                                   tips=DAILY_TIPS,
                                   cat_info=NEWS_CATEGORIES,
                                   ads=ads,
                                   now_date=datetime.now().strftime('%B %d, %Y'))
            with open('static_site/landing.html', 'w', encoding='utf-8') as f:
                f.write(html)

            # Create individual static post wrappers
            from markupsafe import Markup
            all_posts = latest_posts + [
                p
                for cat_data in posts_by_category.values()
                for p in cat_data['active'] + cat_data['archived']
            ]
            # Deduplicate by filename
            seen = set()
            unique_posts = []
            for p in all_posts:
                if p['filename'] not in seen:
                    seen.add(p['filename'])
                    unique_posts.append(p)

            for p in unique_posts:
                filepath = os.path.join(POSTS_DIR, p['filename'])
                if os.path.exists(filepath):
                    with open(filepath, 'r', encoding='utf-8') as pf:
                        html_content = pf.read()
                    article_match = re.search(r'(<article>.*?</article>)', html_content, re.DOTALL)
                    style_match = re.search(r'(<style>.*?</style>)', html_content, re.DOTALL)
                    if article_match:
                        article_html = article_match.group(1)
                        custom_styles = style_match.group(1) if style_match else ""
                        pmtime = os.path.getmtime(filepath)
                        release_date = datetime.fromtimestamp(pmtime).strftime('%B %d, %Y - %I:%M %p')
                        post_wrapper_html = render_template('post_wrapper.html',
                                               article_html=Markup(article_html),
                                               custom_styles=Markup(custom_styles),
                                               cat_info=NEWS_CATEGORIES,
                                               release_date=release_date)
                        with open(os.path.join(STATIC_SITE_DIR, 'post', p['filename']), 'w', encoding='utf-8') as out_f:
                            out_f.write(post_wrapper_html)
                    else:
                        import shutil
                        shutil.copyfile(filepath, os.path.join(STATIC_SITE_DIR, 'post', p['filename']))

        # Copy assets for the static site
        import shutil
        # Copy standard static files
        static_src = os.path.join(PROJECT_ROOT, 'static')
        static_dst = os.path.join(STATIC_SITE_DIR, 'static')
        if os.path.exists(static_src):
            if os.path.exists(static_dst):
                shutil.rmtree(static_dst)
            shutil.copytree(static_src, static_dst)
        
        # Copy generated images
        gen_src = GENERATED_IMG_DIR
        gen_dst = os.path.join(STATIC_SITE_DIR, 'generated')
        if os.path.exists(gen_src):
            if os.path.exists(gen_dst):
                shutil.rmtree(gen_dst)
            shutil.copytree(gen_src, gen_dst)

        # Copy avatars if they exist
        avatar_src = os.path.join(GENERATED_IMG_DIR, 'avatars')
        avatar_dst = os.path.join(STATIC_SITE_DIR, 'avatars')
        if os.path.exists(avatar_src):
            if os.path.exists(avatar_dst):
                shutil.rmtree(avatar_dst)
            shutil.copytree(avatar_src, avatar_dst)

        print("[+] Static site built successfully in static_site/")
        return True
    except Exception as e:
        print(f"[-] Static build failed: {e}")
        return False

# ============================================================================
# FLASK ROUTES
# ============================================================================

@app.route('/')
def home():
    """Serve a clean blog index as a portal with NYT style but dark"""
    latest_posts, posts_by_category = get_posts_for_landing()
    
    # Inject full content for the VERY first post (Hero) 
    if latest_posts:
        hero_post = latest_posts[0]
        filepath = os.path.join(POSTS_DIR, hero_post['filename'])
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                # Extract article body only - Robust extraction
                content_match = re.search(r'<div class="article-content">(.*?)</div>\s*<section class="author-card">', content, re.DOTALL)
                if not content_match:
                    content_match = re.search(r'<div class="article-content">(.*?)</div>\s*</article>', content, re.DOTALL)
                
                if content_match:
                    hero_post['content'] = content_match.group(1)
                else:
                    # Fallback to whole article if no marker
                    article_match = re.search(r'<article>(.*?)</article>', content, re.DOTALL)
                    if article_match:
                        hero_post['content'] = article_match.group(1)
            except Exception as e:
                print(f"[!] Content inject error: {e}")

    ads = get_affiliate_links("default", num_cb=2, num_amz=1, num_sub=2)
    return render_template('landing.html',
                           latest_posts=latest_posts,
                           categories=posts_by_category,
                           tips=DAILY_TIPS,
                           cat_info=NEWS_CATEGORIES,
                           ads=ads,
                           now_date=datetime.now().strftime('%B %d, %Y'))

@app.route('/api/post-content/<filename>')
def get_post_content_api(filename):
    """Fetch just the article body for dynamic injection"""
    filepath = os.path.join(POSTS_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Not found'}), 404
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to get specific content block
        match = re.search(r'<div class="article-content">(.*?)</div>', content, re.DOTALL)
        if not match:
            match = re.search(r'<article>(.*?)</article>', content, re.DOTALL)
            
        if match:
            return jsonify({'content': match.group(1)})
        return jsonify({'content': 'Content block not found in post.'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search')
def search_posts():
    """Search title and content for keywords"""
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify({'results': []})
    
    results = []
    if os.path.exists(POSTS_DIR):
        for filename in os.listdir(POSTS_DIR):
            if filename.endswith('.html'):
                filepath = os.path.join(POSTS_DIR, filename)
                try:
                    with open(filepath, 'r') as f:
                        content = f.read()
                        if query in content.lower():
                            title = re.search(r'<h1>(.*?)</h1>', content).group(1) if re.search(r'<h1>(.*?)</h1>', content) else filename
                            results.append({
                                'title': title,
                                'filename': filename
                            })
                except: continue
    return jsonify({'results': results[:20]})

@app.route('/blog_generator_hero.png')
def send_hero():
    return send_from_directory('.', 'blog_generator_hero.png')

@app.route('/dashboard')
@login_required
def dashboard_portal():
    return render_template('dashboard_v2.html')

@app.route('/ultimate')
@login_required
def dashboard_ultimate_portal():
    return render_template('dashboard_ultimate.html')

@app.route('/assets/<path:path>')
def send_assets(path):
    return send_from_directory('webapp/dist/assets', path)

@app.route('/vite.svg')
def send_vite_svg():
    return send_from_directory('webapp/dist', 'vite.svg')

@app.route('/post/<filename>')
def view_post(filename):
    """View a specific post within the unified theme wrapper"""
    filepath = os.path.join(POSTS_DIR, filename)
    if not os.path.exists(filepath):
        return "Not found", 404
        
    with open(filepath, 'r') as f:
        html_content = f.read()
        
    # Extract the <article> tag
    article_match = re.search(r'(<article>.*?</article>)', html_content, re.DOTALL)
    # Extract the <style> block
    style_match = re.search(r'(<style>.*?</style>)', html_content, re.DOTALL)
    
    if article_match:
        article_html = article_match.group(1)
        custom_styles = style_match.group(1) if style_match else ""
        mtime = os.path.getmtime(filepath)
        release_date = datetime.fromtimestamp(mtime).strftime('%B %d, %Y - %I:%M %p')
        return render_template('post_wrapper.html', 
                               article_html=article_html, 
                               custom_styles=custom_styles,
                               cat_info=NEWS_CATEGORIES,
                               release_date=release_date)
    else:
        # Fallback to direct raw file 
        return send_from_directory(POSTS_DIR, filename)

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
    
    if os.path.exists(POSTS_DIR):
        for filename in os.listdir(POSTS_DIR):
            if filename.endswith('.html'):
                filepath = os.path.join(POSTS_DIR, filename)
                mtime = datetime.fromtimestamp(os.path.getmtime(filepath)).strftime('%Y-%m-%d')
                pages.append({'loc': f'{base_url}/post/{filename}', 'lastmod': mtime})
    
    sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for page in pages:
        sitemap_xml += f"  <url>\n    <loc>{page['loc']}</loc>\n    <lastmod>{page['lastmod']}</lastmod>\n    <changefreq>daily</changefreq>\n  </url>\n"
    sitemap_xml += '</urlset>'
    
    return sitemap_xml, 200, {'Content-Type': 'application/xml'}
@app.route('/api/config', methods=['GET'])
@login_required
def get_config():
    config = load_config()
    # Add geolocation hints if not present
    loc = get_location_from_ip()
    config['detected_location'] = loc['description']
    config['postal_hint'] = loc['postal']
    return jsonify(config)

@app.route('/api/config', methods=['POST'])
@login_required
def save_config_route():
    new_config = request.json
    old_config = load_config()

    was_autopilot = old_config.get('auto_pilot') == 'enabled'
    now_autopilot = new_config.get('auto_pilot') == 'enabled'

    if now_autopilot and not was_autopilot:
        print("[Auto-Pilot] Re-enabled! Verifying older posts to keep homepage populated...")
        now_ts = time.time()
        hours_in_sec = 48 * 3600
        if os.path.exists(POSTS_DIR):
            for filename in os.listdir(POSTS_DIR):
                if filename.endswith('.html'):
                    filepath = os.path.join(POSTS_DIR, filename)
                    try:
                        if now_ts - os.path.getmtime(filepath) > hours_in_sec:
                            os.utime(filepath, (now_ts, now_ts))
                    except Exception:
                        pass
        try:
            if os.path.exists(LANDING_CACHE_FILE):
                os.remove(LANDING_CACHE_FILE)
        except:
            pass

    return jsonify({'success': save_config(new_config)})

@app.route('/api/categories', methods=['GET'])
@login_required
def get_categories():
    return jsonify({'categories': [{"id": k, "name": v["name"]} for k, v in NEWS_CATEGORIES.items()]})

@app.route('/api/writers', methods=['GET'])
@login_required
def get_writers():
    """Get detailed list of all writers and their profiles"""
    writers = load_writers()
    # Add avatar path and mock CV for dashboard display
    for w in writers:
        w['avatar'] = f"/avatars/writer_{w.get('id', 1)}.jpg"
        w['cv_summary'] = f"{w['title']} with expertise in {w.get('style', 'professional writing')}. Known for a {w.get('voice', 'clear')} voice."
    return jsonify({'writers': writers})

@app.route('/api/clickbank-products', methods=['GET'])
@login_required
def get_clickbank_products():
    """Get ClickBank products organized by category"""
    products_by_category = {}
    
    for category_id, category_data in NEWS_CATEGORIES.items():
        products = get_clickbank_products_lib().get(category_id, get_clickbank_products_lib().get("default", []))
        
        # Check if products are placeholders
        products_with_status = []
        for product in products:
            is_placeholder = "YOURVENDOR" in product["url"] or "l4j4n" in product["url"]
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
@login_required
def search():
    client_config = request.json
    save_config(client_config)
    full_config = load_config()
    
    generation_state['news_items'] = []
    generation_state['generated_files'] = []
    
    articles, error = search_with_retry(full_config)
    
    if error:
        return jsonify({'error': error}), 400
    
    generation_state['news_items'] = articles
    return jsonify({'news_items': articles, 'ai_used': full_config.get('ai_provider', 'claude').title()})

@app.route('/api/generate', methods=['POST'])
@login_required
def generate():
    data = request.json
    if not data or 'config' not in data or 'selected_ids' not in data:
        return jsonify({'error': 'Missing data'}), 400
    
    save_config(data['config'])
    full_config = load_config()
    
    generation_state['status'] = 'idle'
    generation_state['progress'] = 0
    generation_state['error'] = None
    generation_state['generated_files'] = []
    
    thread = threading.Thread(target=generation_worker, args=(full_config, data['selected_ids']))
    thread.daemon = True
    thread.start()
    
    return jsonify({'status': 'started'})

@app.route('/api/status', methods=['GET'])
@login_required
def status():
    return jsonify(generation_state)


@app.route('/api/generation-log', methods=['GET'])
@login_required
def api_generation_log():
    """Returns the live generation log lines so the dashboard console can display them."""
    since = request.args.get('since', 0, type=int)   # return only lines after this index
    lines = generation_log[since:]
    return jsonify({'lines': lines, 'total': len(generation_log)})


@app.route('/api/debug-status', methods=['GET'])
def debug_status():
    """Public endpoint — shows generation state, saved files, and errors.
    Access at /api/debug-status to diagnose generation issues without needing a login session."""
    try:
        saved_files = []
        if os.path.exists(POSTS_DIR):
            def safe_mtime(f):
                try: return os.path.getmtime(os.path.join(POSTS_DIR, f))
                except: return 0

            saved_files = sorted(
                [f for f in os.listdir(POSTS_DIR) if f.endswith('.html')],
                key=safe_mtime,
                reverse=True
            )[:20]   # last 20 only

        # Tail the log file
        log_path = os.path.join(DATA_DIR, 'generated_articles_log.txt')
        log_tail = []
        if os.path.exists(log_path):
            with open(log_path, 'r', encoding='utf-8') as lf:
                log_tail = lf.readlines()[-40:]

        return jsonify({
            'generation_state': {
                'status':          generation_state.get('status'),
                'progress':        generation_state.get('progress'),
                'total':           generation_state.get('total'),
                'current_article': generation_state.get('current_article'),
                'error':           generation_state.get('error'),
                'generated_count': len(generation_state.get('generated_files', [])),
                'generated_titles': [f['title'] for f in generation_state.get('generated_files', [])],
            },
            'posts_dir':   POSTS_DIR,
            'data_dir':    DATA_DIR,
            'files_on_disk': saved_files,
            'file_count':    len(saved_files),
            'log_tail':      ''.join(log_tail),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/build-static', methods=['POST'])
@login_required
def api_build_static():
    """Trigger a static site build event manually (also rebuilds the landing index)"""
    # Wipe the cached index so get_posts_for_landing() does a full rescan
    # NEW: Enhanced "Correction" and Image Generation pass
    print("[*] Starting Enhanced Repair & Image Generation pass...")
    reprocess_and_heal_all_posts()
    
    success = build_static_site()
    return jsonify({'success': success})

@app.route('/api/rebuild-landing-index', methods=['POST'])
@login_required
def api_rebuild_landing_index():
    """Rebuild the landing page index from all posts currently on disk.
    Useful for bootstrapping when posts already exist but the index is missing."""
    # Clear existing index so get_posts_for_landing() triggers a full scan
    save_landing_index([])
    # Calling get_posts_for_landing() will scan the filesystem and persist the result
    latest_posts, _ = get_posts_for_landing()
    index = load_landing_index()
    return jsonify({'success': True, 'indexed': len(index), 'latest_count': len(latest_posts)})
    
@app.route('/api/autopilot-status', methods=['GET'])
@login_required
def autopilot_status():
    """Single snapshot used by the dashboard status panel."""
    config      = load_config()
    pending     = load_pending_posts()
    now         = datetime.now()

    gen_hour     = int(config.get('auto_pilot_generate_hour', 5))
    release_hour = int(config.get('auto_pilot_release_hour',  8))
    enabled      = config.get('auto_pilot') == 'enabled'

    def next_occurrence(target_hour):
        """Return a dict with ISO string + human-readable countdown to next target_hour."""
        candidate = now.replace(hour=target_hour, minute=0, second=0, microsecond=0)
        if candidate <= now:
            candidate += timedelta(days=1)
        diff = candidate - now
        h, rem = divmod(int(diff.total_seconds()), 3600)
        m = rem // 60
        if h > 0:
            label = f"in {h}h {m}m"
        else:
            label = f"in {m}m"
        return {
            'iso':   candidate.isoformat(),
            'label': label,
            'time':  candidate.strftime('%I:%M %p'),
        }

    # Count total generated articles
    total_articles = 0
    posts_dir = POSTS_DIR
    if os.path.exists(posts_dir):
        total_articles = sum(1 for f in os.listdir(posts_dir) if f.endswith('.html'))

    # Latest generated (most recent file mtime)
    last_generated = None
    if os.path.exists(posts_dir):
        files = [f for f in os.listdir(posts_dir) if f.endswith('.html')]
        if files:
            try:
                # Find file with max mtime
                mtimes = []
                for f in files:
                    try:
                        m = os.path.getmtime(os.path.join(posts_dir, f))
                        mtimes.append((f, m))
                    except: continue
                
                if mtimes:
                    latest_f, latest_m = max(mtimes, key=lambda x: x[1])
                    if latest_m < 1704067200: # Before Jan 1, 2024
                         current_time = datetime.now().strftime('%b %d, %Y %I:%M %p')
                         last_generated = f"{current_time} (Estimated)" 
                    else:
                        mtime_dt = datetime.fromtimestamp(latest_m)
                        last_generated = mtime_dt.strftime('%b %d, %Y %I:%M %p')
            except Exception as e:
                print(f"[Dashboard] Error calculating last_generated: {e}")
                last_generated = datetime.now().strftime('%b %d, %Y %I:%M %p')

    return jsonify({
        'queued':            len(load_pending_posts()),
        'max_per_run':       MAX_ARTICLES_PER_RUN,
        'gen_hour':          gen_hour,
        'release_hour':      release_hour,
        'next_generate':     next_occurrence(gen_hour),
        'next_release':      next_occurrence(release_hour),
        'pending_count':     len(pending),
        'total_articles':    total_articles,
        'last_generated':    last_generated,
        'generation_state':  {
            'status':          generation_state.get('status', 'idle'),
            'progress':        generation_state.get('progress', 0),
            'total':           generation_state.get('total', 0),
            'current_article': generation_state.get('current_article', ''),
            'current_step':    generation_state.get('current_step', 'idle')
        },
    })

@app.route('/api/download/<filename>')
def download(filename):
    filepath = os.path.join(POSTS_DIR, filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/view/<filename>')
def view(filename):
    filepath = os.path.join(POSTS_DIR, filename)
    if os.path.exists(filepath):
        return send_file(filepath)
    return jsonify({'error': 'Not found'}), 404


# ============================================================================
# NEWSLETTER & SUBSCRIBERS
# ============================================================================

@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    data = request.json
    email = data.get('email')
    if not email or '@' not in email:
        return jsonify({'success': False, 'error': 'Invalid email'}), 400
    
    subs = load_subscribers()
    if email in [s['email'] for s in subs]:
        return jsonify({'success': True, 'message': 'Already subscribed'})
    
    subs.append({
        'email': email,
        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'status': 'active'
    })
    save_subscribers(subs)
    return jsonify({'success': True, 'message': 'Subscribed successfully'})

@app.route('/api/subscribers')
@login_required
def get_subscribers():
    return jsonify({'subscribers': load_subscribers()})

@app.route('/api/push-newsletter', methods=['POST'])
@login_required
def push_newsletter():
    """Generate and 'send' a daily recap newsletter to all subscribers"""
    subs = load_subscribers()
    if not subs:
        return jsonify({'success': False, 'error': 'No subscribers found'})
    
    # Get latest articles
    history = get_recent_history(days=1)
    if not history:
        return jsonify({'success': False, 'error': 'No new articles to recap today'})
    
    recap_html = "<h1>Today's Intelligence Briefing</h1><ul>"
    for item in history[:5]:
        recap_html += f"<li><strong>{item['title']}</strong></li>"
    recap_html += "</ul><p>Read more at KnotStrandedMedia.com</p>"
    
    success_count = 0
    for sub in subs:
        if sub['status'] == 'active':
            if send_demo_email(sub['email'], "KnotStranded Media Daily Recap", recap_html):
                success_count += 1
                
    return jsonify({
        'success': True, 
        'message': f'Newsletter pushed to {success_count} subscribers',
        'articles_recapitulated': len(history[:5])
    })

@app.route('/api/archive', methods=['GET'])
@login_required
def get_archive():
    """Return all generated posts with title, creation date, and filename."""
    posts = []
    posts_dir = POSTS_DIR
    if not os.path.exists(posts_dir):
        return jsonify({'posts': []})

    for filename in os.listdir(posts_dir):
        if not filename.endswith('.html'):
            continue
        filepath = os.path.join(posts_dir, filename)

        # Parse creation date from filename: blog_N_YYYYMMDD_HHMMSS.html
        created_iso = None
        created_display = None
        m = re.match(r'blog_\d+_(\d{8})_(\d{6})\.html', filename)
        if m:
            try:
                dt = datetime.strptime(m.group(1) + m.group(2), '%Y%m%d%H%M%S')
                created_iso = dt.isoformat()
                created_display = dt.strftime('%b %d, %Y  %I:%M %p')
            except ValueError:
                pass
        if not created_iso:
            dt = datetime.fromtimestamp(os.path.getmtime(filepath))
            created_iso = dt.isoformat()
            created_display = dt.strftime('%b %d, %Y  %I:%M %p')

        # Extract title from <h1>
        title = filename
        html = ''
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                html = f.read()
            h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
            if h1:
                raw = re.sub(r'<[^>]+>', '', h1.group(1)).strip()
                if raw and len(raw) > 3 and 'Full URL' not in raw:
                    title = raw[:120]
        except Exception:
            pass

        # Check if it has images
        has_images = '<img' in html.lower() or '[PHOTO' in html.upper()
        
        # Word count for health check
        word_count = len(re.sub(r'<[^>]+>', '', html).split())
        read_mins = max(1, round(word_count / 200))

        posts.append({
            'filename':        filename,
            'title':           title,
            'created_iso':     created_iso,
            'created_display': created_display,
            'read_mins':       read_mins,
            'word_count':      word_count,
            'has_images':      has_images,
            'url':             f'/post/{filename}',
        })

    posts.sort(key=lambda p: p['created_iso'], reverse=True)
    return jsonify({'posts': posts, 'total': len(posts)})


@app.route('/api/archive/refresh_images/<filename>', methods=['POST'])
@login_required
def retry_article_images(filename):
    """Regenerate missing images for an existing article by reparsing it."""
    filepath = os.path.join(POSTS_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Article not found'}), 404
        
    config = load_config()
    openai_key = config.get('openai_api_key')
    gemini_key = config.get('gemini_api_key')
    
    if not openai_key and not gemini_key:
        return jsonify({'error': 'No image generation keys (OpenAI or Gemini) configured'}), 400
        
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Parse existing content to get context
        title_m = re.search(r'<h1>(.*?)</h1>', content)
        title = title_m.group(1) if title_m else filename
        
        # Detect category
        cat_m = re.search(r'<!--\s*category:([\w_]+)\s*-->', content)
        category = cat_m.group(1) if cat_m else 'entertainment'
        
        # Get snippet for context
        snippet_m = re.search(r'<p class="lead">(.*?)</p>', content, re.DOTALL)
        snippet = snippet_m.group(1) if snippet_m else title
        
        # Check if we need images
        placeholders = re.findall(r'\[PHOTO\d\]', content)
        has_img_tags = '<img' in content.lower()
        
        # If no placeholders but also no images, we'll try to insert one at the top
        if not placeholders and not has_img_tags:
            content = content.replace('</h1>', '</h1>\n[PHOTO1]')
            placeholders = ['[PHOTO1]']
            
        # Generate new images
        blog_id = filename.split('_')[1] if '_' in filename else 'ref'
        
        # We'll use the existing generation tools
        if openai_key:
            img_path = generate_featured_image(openai_key, title, blog_id, category, context=snippet)
        else:
            img_path = generate_featured_image_gemini(gemini_key, title, blog_id, category, context=snippet)
            
        if img_path:
            # For archive refresh, we keep it simple: 1 high-quality featured image
            img_rel = '/' + img_path.replace(os.getcwd() + '/', '') if img_path.startswith('/') else '/' + img_path
            
            # Replace placeholders or insert at top
            if '[PHOTO1]' in content:
                img_tag = f'<div class="post-image-container"><img src="{img_rel}" alt="{title}" class="post-featured-image"></div>'
                content = content.replace('[PHOTO1]', img_tag)
            elif not has_img_tags:
                # Insert below H1 if no tags and no placeholder
                img_tag = f'\n<div class="post-image-container"><img src="{img_rel}" alt="{title}" class="post-featured-image"></div>\n'
                content = content.replace('</h1>', '</h1>' + img_tag)
                
            # Clean up remaining markers
            content = re.sub(r'\[PHOTO\d\]', '', content)
            
            # Save updated content
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
            return jsonify({'success': True, 'image_url': img_rel})
        else:
            return jsonify({'error': 'Image generation failed'}), 500
            
    except Exception as e:
        print(f"[Archive Refresh Error] {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/archive/delete/<filename>', methods=['DELETE'])
@login_required
def delete_archived_post(filename):
    """Permanently delete a generated post file."""
    if not re.match(r'^blog_\d+_\d{8}_\d{6}\.html$', filename):
        return jsonify({'error': 'Invalid filename'}), 400
    filepath = os.path.join(POSTS_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    os.remove(filepath)
    # Remove from landing index
    idx = load_landing_index()
    idx = [p for p in idx if p.get('filename') != filename]
    save_landing_index(idx)
    return jsonify({'success': True, 'deleted': filename})


@app.route('/api/archive/replace/<filename>', methods=['POST'])
@login_required
def replace_archived_post(filename):
    """Delete and replace an article with a newly generated one."""
    data = request.json or {}
    title = data.get('title', 'Trending News')
    
    if not re.match(r'^blog_\w+_\d{8}_\d{6}\.html$', filename) and not re.match(r'^blog_\d+_\d{8}_\d{6}\.html$', filename):
        return jsonify({'error': 'Invalid filename'}), 400
        
    filepath = os.path.join(POSTS_DIR, filename)
    category = "general"
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            # remove old file
            os.remove(filepath)
        except:
            pass
            
    config = load_config()
    news_id = f"repl_{int(time.time())}"
    news_item = {
        'id': news_id,
        'title': title,
        'snippet': f"Write an updated and highly optimized article about: {title}.",
        'category': category,
        'source': "Replacement Engine",
        'trend_topic': title
    }
    
    writer = select_random_writer()
    links = get_affiliate_links(category)
    blog_result = generate_blog_with_retry(config, news_item, writer, links)
    
    if 'error' in blog_result and isinstance(blog_result, dict):
        return jsonify({'error': blog_result['error']}), 400
    if isinstance(blog_result, str):
        return jsonify({'error': blog_result}), 400
        
    featured_image = None
    detail_images = []
    if config.get('gemini_api_key'):
        featured_image = generate_featured_image_gemini(config['gemini_api_key'], blog_result['title'], news_id, category)
        detail_images = generate_detail_images_gemini(config['gemini_api_key'], news_id, blog_result['title'], category)
    elif config.get('openai_api_key'):
        featured_image = generate_featured_image(config['openai_api_key'], blog_result['title'], news_id, category)
        detail_images = generate_detail_images(config['openai_api_key'], news_id, blog_result['title'], category)
    
    # Replace markers with actual image paths
    for idx, d_img in enumerate(detail_images):
        img_filename = os.path.basename(d_img)
        blog_result['content'] = blog_result['content'].replace(f"[PHOTO{idx+1}]", f'<div class="inline-photo"><img src="/generated/{img_filename}" alt="Detail"></div>')
        
    html = create_styled_html(blog_result, news_item, config.get('ai_provider', 'claude').title(), featured_image)
    blog_result['html_content'] = html
    blog_result['category'] = category
    blog_result['tags'] = generate_tags(category)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    new_filename = f"blog_{news_id}_{timestamp}.html"
    new_filepath = os.path.join(POSTS_DIR, new_filename)
    
    with open(new_filepath, 'w', encoding='utf-8') as f:
        f.write(html)

    # Update landing index: remove old entry, add new one
    old_idx = load_landing_index()
    old_idx = [p for p in old_idx if p.get('filename') != filename]
    save_landing_index(old_idx)
    img_m = re.search(r'src="(?:/)?(static/img/.*?|generated/.*?)"', html)
    post_img = '/' + img_m.group(1) if img_m else None
    date_m = re.search(r'\u2022 (.*?)</p>', html)
    post_date = date_m.group(1) if date_m else datetime.now().strftime('%B %d, %Y')
    index_post(new_filename, blog_result['title'], post_date, post_img, category)

    return jsonify({
        'success': True,
        'new_filename': new_filename,
        'posted': True,
        'message': "Generated and posted to local blog successfully!"
    })


# ============================================================================
# SQUARESPACE POSTING
# ============================================================================

def post_to_squarespace(config, blog_data):
    """Post to Squarespace API"""
    try:
        api_key = config.get('squarespace_api_key')
        site_id = config.get('squarespace_site_id')
        collection_id = config.get('squarespace_collection_id')
        
        if not all([api_key, site_id, collection_id]):
            return False, "Missing Squarespace config (Key, Site ID, or Collection ID)"
        
        print(f"[Squarespace] Posting article: {blog_data['title'][:50]}...")
        url = f"https://api.squarespace.com/1.0/sites/{site_id}/blog/{collection_id}/posts"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "KnotStranded-Intelligence-Portal/1.0"
        }
        
        # Prepare the block-based or HTML body
        # Squarespace API expects specific JSON for structured content, but often 
        # people use the simplified body if the collection supports it.
        # This implementation uses the primary 'body' field.
        post_data = {
            "title": blog_data['title'],
            "body": blog_data.get('html_content', ''),
            "categories": [blog_data.get('category', 'Entertainment')],
            "tags": blog_data.get('tags', []),
            "publishOn": datetime.now().isoformat()
        }
        
        response = requests.post(url, headers=headers, json=post_data, timeout=30)
        
        if response.status_code in [200, 201]:
            result = response.json()
            full_url = result.get('fullUrl', '')
            print(f"[Squarespace] ✓ Success! Posted to: {full_url}")
            return True, full_url
        else:
            error = f"API {response.status_code}: {response.text[:300]}"
            print(f"[Squarespace] ✗ Failed: {error}")
            return False, error
            
    except Exception as e:
        print(f"[Squarespace] ✗ Error: {str(e)}")
        return False, str(e)

@app.route('/api/post-to-squarespace', methods=['POST'])
@login_required
def api_post_to_squarespace():
    """Trigger a Squarespace post for a specific file."""
    data = request.json
    filename = data.get('filename')
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
        
    filepath = os.path.join(POSTS_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
        
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
            
        # Extract title and category
        title_m = re.search(r'<h1>(.*?)</h1>', html)
        title = title_m.group(1) if title_m else "New Intelligence Report"
        cat_m = re.search(r'<!-- category:([\w_]+) -->', html)
        category = cat_m.group(1) if cat_m else "tech"
        
        config = load_config()
        blog_data = {
            'title': title,
            'html_content': html,
            'category': category,
            'tags': generate_tags(category)
        }
        
        success, result = post_to_squarespace(config, blog_data)
        return jsonify({'success': success, 'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# START BACKGROUND SCHEDULER
# This must be at MODULE LEVEL (not inside __main__) so it runs whether the
# app is started with `python dashboard_app.py` OR with gunicorn (Railway).
# gunicorn imports this module directly — it never executes __main__.
# ============================================================================
generate_clickbank_todo_list()

_ap_thread = threading.Thread(target=auto_pilot_worker, daemon=True, name='AutoPilot')
_ap_thread.start()
print("[Auto-Pilot] Background scheduler thread started.")


if __name__ == '__main__':

    port = int(os.environ.get('PORT', 5000))
    print("\n" + "="*70)
    print(" KNOTSTRANDED BLOG GENERATOR - PRODUCTION READY")
    print("="*70)
    print(f"\n🌐 Server: http://0.0.0.0:{port}")
    print("="*70 + "\n")

    app.run(debug=False, host='0.0.0.0', port=port)
