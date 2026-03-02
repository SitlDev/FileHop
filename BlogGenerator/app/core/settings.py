import json
import os
from app.core.config import Config

def load_settings():
    """Load config with Environment Variable priority for Railway/Production"""
    settings = {}
    if os.path.exists(Config.CONFIG_FILE):
        try:
            with open(Config.CONFIG_FILE, 'r') as f:
                settings = json.loads(f.read().strip() or '{}')
        except:
            settings = {}
    
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
            settings[config_key] = val
            
    return settings

def save_settings(new_settings):
    """Merge and Save config"""
    try:
        current = load_settings()
        current.update(new_settings)
        with open(Config.CONFIG_FILE, 'w') as f:
            json.dump(current, f, indent=2)
        return True
    except:
        return False
