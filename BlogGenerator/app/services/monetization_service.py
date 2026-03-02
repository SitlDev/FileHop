import os
import json
import random
import re
from typing import Dict, List, Any
from app.core.config import Config

def load_affiliate_library() -> Dict[str, Any]:
    if os.path.exists(Config.AFFILIATE_LIBRARY_FILE):
        try:
            with open(Config.AFFILIATE_LIBRARY_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_affiliate_library(data: Dict[str, Any]):
    with open(Config.AFFILIATE_LIBRARY_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def get_affiliate_links(category: str, context: str = None) -> Dict[str, List[Dict[str, str]]]:
    """Retrieves relevant affiliate links from the library for a given category and context."""
    library = load_affiliate_library()
    pool = library.get(category, [])
    if not pool:
        pool = library.get('general', [])
        
    # Pick top 5 based on keyword relevance if context exists
    if context:
        # Simple scoring based on keyword frequency
        scored = []
        for p in pool:
            score = 0
            keywords = p.get('keywords', [])
            for k in keywords:
                if k.lower() in context.lower():
                    score += 1
            scored.append((score, p))
        scored.sort(key=lambda x: x[0], reverse=True)
        pool = [x[1] for x in scored[:5]]
    else:
        # Just random selection if no context
        random.shuffle(pool)
        pool = pool[:5]
        
    return {'clickbank': pool}

def resolve_placeholders(content: str, affiliate_id: str) -> str:
    """Replaces YOURID or other placeholders in the affiliate links within the content."""
    if affiliate_id:
        content = content.replace("YOURID", affiliate_id)
    return content

def update_vendor_mapping(mapping_data: Dict[str, str]):
    """Saves a vendor mapping to resolve YOURVENDOR placeholders later."""
    mapping_file = os.path.join(Config.DATA_DIR, "vendor_mapping.json")
    with open(mapping_file, 'w') as f:
        json.dump(mapping_data, f, indent=2)
