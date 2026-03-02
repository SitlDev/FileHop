import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'knotstranded-secret-key-9988')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '!H14Sua12')
    API_SECRET_KEY = os.environ.get('API_SECRET_KEY', '')
    
    # Persistent data directory
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR = os.environ.get('DATA_DIR', PROJECT_ROOT)
    
    # Core Directories
    POSTS_DIR = os.path.join(DATA_DIR, 'knot_storage')
    GENERATED_IMG_DIR = os.path.join(DATA_DIR, 'knot_images')
    STATIC_SITE_DIR = os.path.join(DATA_DIR, 'static_site')
    AVATARS_DIR = os.path.join(DATA_DIR, 'static/avatars')
    
    # Core Files
    CONFIG_FILE = os.path.join(DATA_DIR, 'blog_settings.json')
    SUBSCRIBERS_FILE = os.path.join(DATA_DIR, 'subscribers.json')
    LANDING_INDEX_FILE = os.path.join(DATA_DIR, 'landing_index.json')
    PENDING_POSTS_FILE = os.path.join(DATA_DIR, 'pending_posts.json')
    AFFILIATE_LIBRARY_FILE = os.path.join(DATA_DIR, 'affiliate_library.json')
    WRITERS_FILE = os.path.join(DATA_DIR, 'writers.json')
    
    @classmethod
    def ensure_dirs(cls):
        for directory in [cls.POSTS_DIR, cls.GENERATED_IMG_DIR, cls.STATIC_SITE_DIR, cls.AVATARS_DIR]:
            os.makedirs(directory, exist_ok=True)
