import os
from flask import Blueprint, render_template, abort, send_from_directory
from datetime import datetime
from app.core.config import Config
from app.core.constants import NEWS_CATEGORIES
from app.services.article_service import get_posts_for_landing, get_post_content
from app.services.monetization_service import load_affiliate_library

blog = Blueprint('blog', __name__)

@blog.route('/')
def home():
    """Main Landing Page."""
    posts = get_posts_for_landing()
    ads = load_affiliate_library()
    
    # Categorize posts for deep sections
    cat_posts = {}
    for p in posts:
        cat = p['category']
        if cat not in cat_posts:
            cat_posts[cat] = {'active': [], 'archived': []}
        # In this refactor, all recent ones are active
        cat_posts[cat]['active'].append(p)

    return render_template('landing.html', 
                            latest_posts=posts, 
                            categories=cat_posts,
                            cat_info=NEWS_CATEGORIES,
                            ads=ads,
                            now_date=datetime.now().strftime('%B %d, %Y'))

@blog.route('/post/<filename>')
def view_post(filename):
    """Article Viewer."""
    if not filename.endswith('.html'):
        filename += '.html'
    content = get_post_content(filename)
    if not content:
        abort(404)
    # The current create_styled_html creates full HTML doc, so we just return it.
    return content

@blog.route('/generated/<path:filename>')
def serve_image(filename):
    """Serves generated images from the knot_images directory."""
    return send_from_directory(Config.GENERATED_IMG_DIR, filename)

@blog.route('/static/avatars/<path:filename>')
def serve_avatar(filename):
    """Serves author avatars."""
    return send_from_directory(os.path.join(Config.PROJECT_ROOT, 'static', 'avatars'), filename)
