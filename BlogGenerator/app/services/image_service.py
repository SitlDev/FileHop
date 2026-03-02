import os
import requests
import base64
import random
from datetime import datetime
from app.core.config import Config

def generate_featured_image(api_key, provider, title, blog_id, category='entertainment', context=None, image_type='featured'):
    """Router for image generation (featured or detail)"""
    try:
        if provider == 'gemini':
            return _generate_gemini_image(api_key, title, blog_id, category, context, image_type)
        elif provider == 'openai':
            return _generate_openai_image(api_key, title, blog_id, category, context, image_type)
        else:
            return generate_placeholder_image(category, title, blog_id)
    except Exception as e:
        print(f"[Image Error] {e}")
        return generate_placeholder_image(category, title, blog_id)

def _generate_gemini_image(api_key, title, blog_id, category, context, image_type):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key={api_key}"
    context_prompt = f"Depicting: {context[:200]}..." if context else f"Topic: {title}"
    prompt = f"Hyper-realistic, 8k editorial photography for {category}. {context_prompt}. NO TEXT, NO LOGOS."
    payload = {"instances": [{"prompt": prompt}], "parameters": {"sampleCount": 1}}
    
    r = requests.post(url, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()
    
    if "predictions" in data and len(data["predictions"]) > 0:
        img_data = base64.b64decode(data["predictions"][0]["bytesBase64Encoded"])
        filename = f"{image_type}_{blog_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        filepath = os.path.join(Config.GENERATED_IMG_DIR, filename)
        with open(filepath, 'wb') as f: f.write(img_data)
        return filepath
    raise Exception("Gemini Imagen failed.")

def _generate_openai_image(api_key, title, blog_id, category, context, image_type):
    import openai
    openai.api_key = api_key
    context_prompt = f"Depicting: {context[:200]}..." if context else f"Topic: {title}"
    prompt = f"Cinematic editorial photo for {category}. {context_prompt}. High detail, NO TEXT."
    
    response = openai.images.generate(model="dall-e-3", prompt=prompt, n=1, size="1024x1024")
    img_url = response.data[0].url
    img_data = requests.get(img_url, timeout=30).content
    filename = f"{image_type}_{blog_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    filepath = os.path.join(Config.GENERATED_IMG_DIR, filename)
    with open(filepath, 'wb') as f: f.write(img_data)
    return filepath

def generate_placeholder_image(category, title, blog_id):
    """High-quality Unsplash fallbacks"""
    from app.core.constants import NEWS_CATEGORIES
    # Simplified placeholder logic
    pool = ["https://images.unsplash.com/photo-1518770660439-4636190af475", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"]
    base_url = random.choice(pool)
    seed = f"{blog_id}_{random.randint(1, 1000)}"
    return f"{base_url}?auto=format&fit=crop&w=1200&seed={seed}"
