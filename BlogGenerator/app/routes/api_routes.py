import re
from flask import Blueprint, jsonify, request, session
from functools import wraps
from app.core.config import Config
from app.core.settings import load_settings, save_settings
from app.services.curation_service import search_trending_news
from app.services.monetization_service import load_affiliate_library, save_affiliate_library
from app.services.article_service import get_posts_for_landing, get_post_content

api = Blueprint('api', __name__, url_prefix='/api')

def api_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return jsonify({'error': 'Unauthorized', 'code': 401}), 401
        return f(*args, **kwargs)
    return decorated_function

@api.route('/search', methods=['POST'])
@api_login_required
def api_search_trends():
    from app.tasks.autopilot_task import generation_state
    data = request.json or {}
    # Auto-save config from search payload if present
    if data.get('ai_provider'):
        save_settings(data)
    
    settings = load_settings()
    num = int(data.get('num_articles', 5))
    cats = data.get('selected_categories', ['tech'])
    
    results, err = search_trending_news(num, '', cats)
    if err: return jsonify({'error': err}), 500
    
    generation_state['news_items'] = results
    return jsonify({'news_items': results, 'ai_used': settings.get('ai_provider', 'claude').title()})

@api.route('/status', methods=['GET'])
@api_login_required
def api_status():
    from app.tasks.autopilot_task import generation_state
    return jsonify(generation_state)

@api.route('/config', methods=['GET', 'POST'])
@api_login_required
def api_config():
    if request.method == 'GET':
        config = load_settings()
        from app.utils.helpers import get_location_from_ip
        loc = get_location_from_ip()
        config['detected_location'] = loc['description']
        config['postal_hint'] = loc['postal']
        return jsonify(config)
    else:
        data = request.json or {}
        save_settings(data)
        return jsonify(load_settings())

@api.route('/generate', methods=['POST'])
@api_login_required
def api_trigger_generation():
    from app.tasks.autopilot_task import start_generation
    data = request.json or {}
    settings = load_settings()
    selected_ids = data.get('selected_ids', [])
    if not selected_ids:
        return jsonify({'error': 'No articles selected'}), 400
    start_generation(settings, selected_ids)
    return jsonify({'status': 'pending', 'message': 'Generation pipeline initiated.'})

@api.route('/post-content/<filename>')
def api_post_content(filename):
    """Returns raw HTML content of a post for the dynamic hero feature."""
    content = get_post_content(filename)
    if content:
        # Extract just the <article> or body content to avoid double-nesting
        article_match = re.search(r'<article.*?>(.*?)</article>', content, re.DOTALL | re.IGNORECASE)
        if article_match:
            return jsonify({'content': article_match.group(1)})
        return jsonify({'content': content})
    return jsonify({'error': 'Not found'}), 404

@api.route('/search')
def api_search():
    """Handles frontend search requests across generated articles."""
    query = request.args.get('q', '').lower()
    posts = get_posts_for_landing()
    results = [p for p in posts if query in p['title'].lower() or query in p['category'].lower()]
    return jsonify({'results': results[:20]})

@api.route('/affiliate-library', methods=['GET', 'POST'])
@api_login_required
def api_affiliate_library():
    if request.method == 'GET':
        return jsonify(load_affiliate_library())
    else:
        data = request.json or {}
        lib = load_affiliate_library()
        lib.update(data)
        save_affiliate_library(lib)
        return jsonify(lib)

@api.route('/generation-log', methods=['GET'])
@api_login_required
def api_generation_log():
    from app.utils.helpers import get_log_tail
    return jsonify({'lines': get_log_tail(), 'total': 0})

@api.route('/stop-generation', methods=['POST'])
@api_login_required
def api_stop_generation():
    # Simplistic stop for now: clear the queue
    from app.tasks.autopilot_task import generation_state
    generation_state['status'] = 'idle'
    generation_state['error'] = 'Generation stopped by user.'
    return jsonify({'status': 'stopped'})

@api.route('/post-to-squarespace', methods=['POST'])
@api_login_required
def api_post_to_squarespace():
    from app.services.squarespace_service import post_to_squarespace, generate_tags
    from app.core.settings import load_settings
    import os
    
    data = request.json or {}
    filename = data.get('filename')
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
        
    filepath = os.path.join(Config.POSTS_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
        
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
            
        title_m = re.search(r'<h1>(.*?)</h1>', html)
        title = title_m.group(1) if title_m else "New Intelligence Report"
        cat_m = re.search(r'<!-- category:([\w_]+) -->', html)
        category = cat_m.group(1) if cat_m else "general"
        
        settings = load_settings()
        blog_data = {
            'title': title,
            'html_content': html,
            'category': category,
            'tags': generate_tags(category)
        }
        
        success, result = post_to_squarespace(settings, blog_data)
        return jsonify({'success': success, 'url': result if success else None, 'error': result if not success else None})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/view/<filename>')
def api_view_post(filename):
    from flask import send_from_directory
    return send_from_directory(Config.POSTS_DIR, filename)

@api.route('/download/<filename>')
def api_download_post(filename):
    from flask import send_file
    import os
    filepath = os.path.join(Config.POSTS_DIR, filename)
    return send_file(filepath, as_attachment=True)

@api.route('/autopilot-status', methods=['GET'])
@api_login_required
def api_autopilot_status():
    from app.tasks.autopilot_task import generation_state
    from app.core.settings import load_settings
    from datetime import datetime, timedelta
    import os
    import json
    
    settings = load_settings()
    now = datetime.now()
    
    gen_hour = int(settings.get('auto_pilot_generate_hour', 5))
    release_hour = int(settings.get('auto_pilot_release_hour', 8))
    enabled = settings.get('auto_pilot') == 'enabled'
    auto_post = settings.get('auto_post_squarespace') == 'enabled'
    
    def next_occurrence(target_hour):
        candidate = now.replace(hour=target_hour, minute=0, second=0, microsecond=0)
        if candidate <= now:
            candidate += timedelta(days=1)
        diff = candidate - now
        h, rem = divmod(int(diff.total_seconds()), 3600)
        m = rem // 60
        label = f"in {h}h {m}m" if h > 0 else f"in {m}m"
        return {'iso': candidate.isoformat(), 'label': label, 'time': candidate.strftime('%I:%M %p')}

    total_articles = 0
    if os.path.exists(Config.POSTS_DIR):
        total_articles = sum(1 for f in os.listdir(Config.POSTS_DIR) if f.endswith('.html'))
        
    pending_count = 0
    if os.path.exists(Config.PENDING_POSTS_FILE):
        try:
            with open(Config.PENDING_POSTS_FILE, 'r') as f:
                pending_count = len(json.load(f))
        except: pass

    last_generated = "never"
    if os.path.exists(Config.POSTS_DIR):
        files = [f for f in os.listdir(Config.POSTS_DIR) if f.endswith('.html')]
        if files:
            try:
                latest_m = max(os.path.getmtime(os.path.join(Config.POSTS_DIR, f)) for f in files)
                last_generated = datetime.fromtimestamp(latest_m).strftime('%b %d, %I:%M %p')
            except: pass

    return jsonify({
        'enabled': enabled,
        'auto_post': auto_post,
        'gen_hour': gen_hour,
        'release_hour': release_hour,
        'next_generate': next_occurrence(gen_hour),
        'next_release': next_occurrence(release_hour),
        'total_articles': total_articles,
        'pending_count': pending_count,
        'last_generated': last_generated,
        'generation_state': generation_state
    })

@api.route('/archive', methods=['GET'])
@api_login_required
def api_archive():
    return jsonify({'posts': get_posts_for_landing()})
