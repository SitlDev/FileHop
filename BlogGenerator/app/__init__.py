from flask import Flask
import os
from app.core.config import Config
from app.routes.blog_routes import blog
from app.routes.dashboard_routes import dashboard
from app.routes.api_routes import api

def create_app():
    """Application Factory."""
    app = Flask(__name__, 
                template_folder='templates', 
                static_folder='static')
    
    app.config.from_object(Config)
    Config.ensure_dirs()
    
    # Register Blueprints
    app.register_blueprint(blog)
    app.register_blueprint(dashboard)
    app.register_blueprint(api)
    
    # Custom Error Pages
    @app.errorhandler(404)
    def page_not_found(e):
        from flask import render_template
        return render_template('404.html'), 404
        
    return app
