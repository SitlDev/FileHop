import threading
import time
import os
import re
from datetime import datetime
from app.core.config import Config
from app.services.generation_service import generate_blog_with_retry
from app.services.image_service import generate_featured_image, generate_placeholder_image
from app.services.monetization_service import get_affiliate_links
from app.services.article_service import index_post, create_styled_html
from app.services.writer_service import select_random_writer
from app.services.curation_service import crawl_full_article
from app.utils.helpers import log_gen

# Persistent state for background tasks
generation_state = {
    'status': 'idle',
    'progress': 0,
    'total': 0,
    'current_article': '',
    'current_step': '',
    'generated_files': [],
    'error': None,
    'news_items': []
}

worker_serial = 0
global_worker_lock = threading.Lock()

def start_generation(settings, selected_ids):
    global worker_serial
    with global_worker_lock:
        worker_serial += 1
        serial = worker_serial
        
    thread = threading.Thread(target=generation_worker, args=(settings, selected_ids, serial), daemon=True)
    thread.start()
    return serial

def generation_worker(settings, selected_ids, serial):
    global generation_state
    
    try:
        items = [item for item in generation_state.get('news_items', []) if item['id'] in selected_ids]
        if not items:
            generation_state['status'] = 'error'
            generation_state['error'] = "No items selected."
            return

        generation_state['status'] = 'generating'
        generation_state['total'] = len(items)
        generation_state['progress'] = 0
        
        target_words = int(settings.get('word_count', 500))
        provider = settings.get('ai_provider', 'claude')

        log_gen(f"Starting pipeline (Sequential)... Provider: {provider}", "info")
        
        for idx, news_item in enumerate(items, 1):
            if serial != worker_serial:
                log_gen("Process superseded by new task.", "info")
                return
                
            generation_state['progress'] = idx
            generation_state['current_article'] = news_item['title']
            
            # 1. Preparations
            writer = select_random_writer()
            category = news_item.get('category', 'general')
            
            # 2. Context Collection
            log_gen(f"[{idx}/{len(items)}] Fetching context for: {news_item['title'][:50]}...")
            generation_state['current_step'] = 'crawl'
            full_text = crawl_full_article(news_item['link'])
            if full_text:
                news_item['full_context'] = full_text
            
            # 3. Monetization
            links = get_affiliate_links(category, context=news_item.get('full_context'))
            
            # 4. Content Generation
            log_gen(f"  - Requesting {target_words} words from {provider.title()}...", "writing")
            generation_state['current_step'] = 'writing'
            blog_result = generate_blog_with_retry(settings, news_item, writer, links, target_words=target_words)
            
            # 5. Imagery
            log_gen("  - Generating imagery...", "info")
            generation_state['current_step'] = 'imagery'
            img_provider = settings.get('image_provider', 'gemini')
            gemini_key = settings.get('gemini_api_key')
            
            # Generate Featured Image
            featured_image = generate_placeholder_image(category, blog_result['title'], news_item['id'])
            try:
                featured_image = generate_featured_image(gemini_key, img_provider, blog_result['title'], news_item['id'], category, context=blog_result.get('content'), image_type='featured')
            except: pass
            
            # Generate Detail Images for markers like [PHOTO1], [PHOTO2]
            detail_images = []
            markers = re.findall(r'\[?PHOTO(\d+)\]?', blog_result.get('content', ''), re.IGNORECASE)
            if markers:
                log_gen(f"  - Found {len(markers)} detail image markers. Generating...", "info")
                for i, m in enumerate(markers):
                    try:
                        # Find context around the marker
                        marker_text = f"PHOTO{m}"
                        ctx = blog_result['content']
                        # Try to find the paragraph containing the marker
                        paragraphs = ctx.split('\n\n')
                        p_ctx = next((p for p in paragraphs if marker_text in p), blog_result['title'])
                        
                        img_path = generate_featured_image(gemini_key, img_provider, f"Detail {m} for {blog_result['title']}", news_item['id'], category, context=p_ctx, image_type=f'detail_{m}')
                        detail_images.append(img_path)
                    except Exception as e:
                        print(f"Detail image {m} failed: {e}")
            
            # 6. Assembly
            log_gen("  - Finalizing article structure...", "info")
            generation_state['current_step'] = 'save'
            p_date = datetime.now().strftime('%B %d, %Y')
            html = create_styled_html(blog_result, news_item, provider.title(), featured_image, detail_images, publish_date=p_date)
            
            # 7. Persistence
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"blog_{news_item['id']}_{timestamp}.html"
            filepath = os.path.join(Config.POSTS_DIR, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f'<!-- category:{category} -->\n' + html)
            
            # Index for landing
            index_post(filename, blog_result['title'], p_date, featured_image, category)
            
            generation_state['generated_files'].append({
                'filename': filename, 'title': blog_result['title'], 'writer': writer['name']
            })
            
            log_gen(f"  ✅ Complete!", "ok")
            
            # Cooling down
            if idx < len(items):
                time.sleep(5)
            
        generation_state['status'] = 'complete'
        
    except Exception as e:
        generation_state['status'] = 'error'
        generation_state['error'] = str(e)
        log_gen(f"Pipeline Failure: {e}", "err")
