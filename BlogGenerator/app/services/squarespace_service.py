import requests
import re
import random
from datetime import datetime
from app.core.constants import NEWS_CATEGORIES

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

def generate_tags(category):
    """Generate 3 tags for category"""
    tags = NEWS_CATEGORIES.get(category, {}).get("tags", ["news", "intelligence", "trends"])
    return random.sample(tags, min(3, len(tags)))
