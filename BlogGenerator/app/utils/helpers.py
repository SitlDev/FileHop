import requests
import re
import random
import time
from flask import request
from typing import Dict, Any

def get_location_from_ip() -> Dict[str, str]:
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

def clean_blog_content(content: str, title: str) -> str:
    """Post-generation text normalization and cleanup"""
    # Remove AI conversational filler
    junk = [
        "Certainly!", "Here is your article:", "I hope you enjoy it.",
        "Sure thing,", "Okay,", "Here's a deep dive", "As requested,"
    ]
    for j in junk:
        content = re.sub(rf'^{j}', '', content, flags=re.IGNORECASE)
        
    # Standardize spaces and newlines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Simple list fixing (AI often uses - instead of <ul><li>)
    # This is a basic heuristic, can be improved
    lines = content.split('\n')
    new_lines = []
    in_list = False
    for line in lines:
        if line.strip().startswith('- '):
            if not in_list:
                new_lines.append('<ul>')
                in_list = True
            new_lines.append(f'<li>{line.strip()[2:]}</li>')
        else:
            if in_list:
                new_lines.append('</ul>')
                in_list = False
            new_lines.append(line)
    if in_list: new_lines.append('</ul>')
    
    return "\n".join(new_lines)


def log_gen(message, type='info'):
    """Central logging for generation events (can be expanded)"""
    from datetime import datetime
    ts = datetime.now().strftime('%H:%M:%S')
    symbol = "🔹"
    if type == 'ok': symbol = "✅"
    if type == 'err': symbol = "❌"
    if type == 'writing': symbol = "✍️"
    
    # We can handle generation_log global here if needed, or return a formatted string
    msg = f"[{ts}] {symbol} {message}"
    print(msg) # stdout for terminal
    return msg
