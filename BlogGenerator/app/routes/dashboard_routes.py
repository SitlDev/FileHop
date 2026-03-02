from flask import Blueprint, render_template, request, session, redirect, url_for, flash
import os
from functools import wraps
from datetime import datetime
from app.core.config import Config
from app.core.settings import load_settings, save_settings
from app.core.constants import NEWS_CATEGORIES
from app.services.article_service import get_posts_for_landing

dashboard = Blueprint('dashboard', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return redirect(url_for('dashboard.login'))
        return f(*args, **kwargs)
    return decorated_function

@dashboard.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password == Config.ADMIN_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('dashboard.index'))
        else:
            flash('Invalid admin credentials.', 'error')
    return render_template('login.html')

@dashboard.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('blog.home'))

@dashboard.route('/dashboard')
@login_required
def index():
    """Main Control Panel with System Stats."""
    settings = load_settings()
    posts = get_posts_for_landing()
    stats = {
        'total_posts': len(posts),
        'total_images': len(os.listdir(Config.GENERATED_IMG_DIR)) if os.path.exists(Config.GENERATED_IMG_DIR) else 0,
    }
    return render_template('dashboard_ultimate.html', 
                            settings=settings, 
                            posts=posts[:100], 
                            stats=stats,
                            cat_info=NEWS_CATEGORIES)

@dashboard.route('/dashboard/settings', methods=['POST'])
@login_required
def update_settings():
    new_settings = request.form.to_dict()
    new_settings['selected_categories'] = request.form.getlist('categories')
    save_settings(new_settings)
    flash('System configuration updated!', 'success')
    return redirect(url_for('dashboard.index'))
