import os
import re
import json
import time
from datetime import datetime
import io

os.environ['APP_URL'] = 'http://localhost:5000'

DATA_DIR = os.environ.get('DATA_DIR', '.')

def load_config():
    cfg_path = os.path.join(DATA_DIR, 'blog_settings.json')
    if not os.path.exists(cfg_path):
        return {}
    with open(cfg_path, 'r') as f:
        return json.load(f)

config = load_config()
api_key = config.get('gemini_api_key')

if not api_key:
    print("fix_images.py: No Gemini API key in config — skipping image fix.")
    exit(0)

posts_dir = os.path.join(DATA_DIR, 'generated_posts')
if not os.path.exists(posts_dir) or not os.listdir(posts_dir):
    print("fix_images.py: No generated posts found — skipping image fix.")
    exit(0)

try:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
except ImportError:
    print("fix_images.py: google-generativeai not installed — skipping.")
    exit(0)

try:
    imagen = genai.ImageGenerationModel("imagen-3.0-generate-001")
except AttributeError:
    print("Gemini Imagen not found")
    exit(0)

def generate_featured_image_gemini(api_key, title, blog_id, category='general'):
    try:
        styles = {
            "tech": "Futuristic, sleek, digital innovation aesthetic, high-tech neon accents",
            "finance": "Professional, data-driven, clean minimalism, sophisticated corporate colors",
            "health": "Natural, organic, bright and airy, wellness-focused sanctuary vibes",
            "lifestyle": "Vibrant, trendy, warm lighting, cozy and aesthetic arrangement",
            "science": "Cosmic, micro-detailed, scientific discovery atmosphere, intriguing and accurate",
            "sports": "Action-oriented, dynamic motion blur, high-energy stadium atmosphere",
            "us_politics": "Professional, authoritative, Washington D.C. architecture, capital city vibe",
            "general": "Cinematic, elegant editorial style"
        }
        style_desc = styles.get(category, "Cinematic, elegant editorial style")
        prompt = f"Hyper-realistic, 8k, ultra-detailed editorial photography for a {category} magazine cover: '{title}'. Style: {style_desc}. Professional lighting, masterpiece, no text."
        
        result = imagen.generate_images(
            prompt=prompt,
            number_of_images=1,
            aspect_ratio="16:9"
        )
        if result and result.images:
            os.makedirs('generated_posts', exist_ok=True)
            filename = f"featured_{blog_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            filepath = os.path.join('generated_posts', filename)
            
            img_bytes = None
            if hasattr(result.images[0], '_image_bytes'):
                img_bytes = result.images[0]._image_bytes
            elif hasattr(result.images[0], 'image'):
                buf = io.BytesIO()
                result.images[0].image.save(buf, format='PNG')
                img_bytes = buf.getvalue()
                
            if img_bytes:
                with open(filepath, 'wb') as f:
                    f.write(img_bytes)
                return filename
    except Exception as e:
        print(f"Error generation featured: {e}")
    return None

def generate_detail_images_gemini(api_key, blog_id, title, category, num=3):
    file_names = []
    try:
        for i in range(num):
            prompt = f"Detail shot for a {category} article: '{title}'. Macro photography, ultra-realistic, professional lighting, cinematic depth of field. Shot {i+1} of 3. No text."
            result = imagen.generate_images(prompt=prompt, number_of_images=1)
            
            if result and result.images:
                filename = f"detail_{blog_id}_{i+1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                filepath = os.path.join('generated_posts', filename)
                
                img_bytes = None
                if hasattr(result.images[0], '_image_bytes'):
                    img_bytes = result.images[0]._image_bytes
                elif hasattr(result.images[0], 'image'):
                    buf = io.BytesIO()
                    result.images[0].image.save(buf, format='PNG')
                    img_bytes = buf.getvalue()
                    
                if img_bytes:
                    with open(filepath, 'wb') as f:
                        f.write(img_bytes)
                    file_names.append(filename)
    except Exception as e:
        print(f"Error generating details: {e}")
    return file_names

files = [f for f in os.listdir(posts_dir) if f.endswith('.html')]

import random
for file in files:
    filepath = os.path.join(posts_dir, file)
    with open(filepath, 'r') as f:
        content = f.read()
        
    if "hero-image-container" in content or "class=\"hero-image\"" in content:
        print(f"{file} already has images.")
        continue
        
    print(f"Processing {file}...")
    
    # Extract title
    title_match = re.search(r'<h1>(.*?)</h1>', content)
    if not title_match:
        title = "Important News"
    else:
        title = title_match.group(1)
        
    blog_id = file.replace('.html', '').replace('blog_', '')
    category = "general"
    
    print(f"Generating featured image for '{title}'...")
    featured = generate_featured_image_gemini(api_key, title, blog_id, category)
    
    print(f"Generating detail images for '{title}'...")
    details = generate_detail_images_gemini(api_key, blog_id, title, category, num=2)
    
    if featured:
        img_html = f'<div class="hero-image-container"><img src="/generated/{featured}" class="hero-image" style="width:100%; height:auto;" alt="{title}"></div>\n'
        content = re.sub(r'(</header>)', rf'\1\n{img_html}', content)
        
    if details:
        paragraphs = content.split('<p>')
        if len(paragraphs) > 3 and len(details) > 0:
            paragraphs[2] = paragraphs[2] + f'\n<div class="inline-photo" style="margin: 30px 0;"><img src="/generated/{details[0]}" alt="Detail" style="width:100%; height:auto; border-radius:8px;"></div>\n'
        if len(paragraphs) > 6 and len(details) > 1:
            paragraphs[5] = paragraphs[5] + f'\n<div class="inline-photo" style="margin: 30px 0;"><img src="/generated/{details[1]}" alt="Detail" style="width:100%; height:auto; border-radius:8px;"></div>\n'
        content = '<p>'.join(paragraphs)
        
    with open(filepath, 'w') as f:
        f.write(content)
        
    print(f"Updated {file}!")
    time.sleep(5)

