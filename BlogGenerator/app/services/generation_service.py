import re
import time
import random
import requests
import json
from app.core.config import Config
from app.utils.helpers import log_gen, clean_blog_content

def generate_blog_with_retry(settings, news_item, writer, affiliate_links, target_words=500, max_retries=3):
    """
    Generate with retry across multiple providers.
    Uses a Tiered Rescue System to ensure the 'Desired Outcome' is met.
    """
    primary_provider = settings.get('ai_provider', 'claude')
    temp = float(settings.get('temperature', 0.8))
    output_tokens_buffer = max(2000, target_words * 4)
    
    fallbacks = ['gemini', 'chatgpt', 'claude', 'groq', 'openrouter']
    if primary_provider in fallbacks:
        fallbacks.remove(primary_provider)
    
    provider_chain = [primary_provider] + fallbacks + ['ollama']
    
    for provider in provider_chain:
        # Credential check
        if provider == 'chatgpt' and not settings.get('openai_api_key'): continue
        if provider == 'gemini' and not settings.get('gemini_api_key'): continue
        if provider == 'claude' and not settings.get('anthropic_api_key'): continue
        if provider == 'groq' and not settings.get('groq_api_key'): continue
        if provider == 'openrouter' and not settings.get('openrouter_api_key'): continue
        
        log_gen(f"Attempting generation with {provider.title()}...", "info")
        
        for attempt in range(max_retries):
            current_temp = temp if attempt == 0 else max(0.4, temp - 0.2)
            try:
                if provider == 'chatgpt':
                    return _generate_with_chatgpt(settings['openai_api_key'], news_item, current_temp, output_tokens_buffer, writer, affiliate_links, target_words)
                elif provider == 'gemini':
                    return _generate_with_gemini(settings['gemini_api_key'], news_item, current_temp, output_tokens_buffer, writer, affiliate_links, target_words)
                elif provider == 'groq':
                    return _generate_with_groq(settings['groq_api_key'], news_item, current_temp, output_tokens_buffer, writer, affiliate_links, target_words)
                elif provider == 'openrouter':
                    return _generate_with_openrouter(settings['openrouter_api_key'], news_item, current_temp, output_tokens_buffer, writer, affiliate_links, target_words)
                elif provider == 'ollama':
                    return _generate_with_ollama(settings, news_item, writer, affiliate_links, target_words)
                else: # claude
                    return _generate_with_claude(settings['anthropic_api_key'], news_item, current_temp, output_tokens_buffer, writer, affiliate_links, target_words)
            except Exception as e:
                err_msg = str(e).lower()
                is_rate_limit = any(keyword in err_msg for keyword in ['rate', 'quota', '429', 'overloaded', 'capacity'])
                if is_rate_limit and attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 20
                    log_gen(f"{provider.title()} rate limited. Backing off {wait_time}s...", "info")
                    time.sleep(wait_time)
                    continue
                else:
                    log_gen(f"{provider.title()} error: {err_msg[:100]}...", "err")
                    break 
    
    raise Exception("All AI providers exhausted.")

# --- Internal Provider Logic (Stripped and Optimized) ---

def _generate_with_chatgpt(api_key, news_item, temperature, max_tokens, writer, links, target_words):
    import openai
    openai.api_key = api_key
    cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('clickbank', []))])
    full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
    
    prompt = f"You are {writer['name']}, {writer['title']} at KnotStranded Media.\nWrite a ~{target_words} word article.\nCONTEXT: {full_context}\nPOOL: {cb_text}\nFORMAT: TITLE: ... CONTENT: ..."
    
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": f"You are {writer['name']}"}, {"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature
    )
    full_text = response.choices[0].message.content
    return _process_response(full_text, news_item, writer, links)

def _generate_with_gemini(api_key, news_item, temperature, max_tokens, writer, links, target_words):
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro')
    cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('clickbank', []))])
    full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
    
    prompt = f"You are {writer['name']}, {writer['title']} at KnotStranded Media.\nWrite a ~{target_words} word article.\nCONTEXT: {full_context}\nPOOL: {cb_text}\nFORMAT: TITLE: ... CONTENT: ..."
    
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            candidate_count=1,
            max_output_tokens=max_tokens,
            temperature=temperature
        )
    )
    return _process_response(response.text, news_item, writer, links)

def _generate_with_claude(api_key, news_item, temperature, max_tokens, writer, links, target_words):
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('clickbank', []))])
    full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
    
    prompt = f"You are {writer['name']}, {writer['title']} at KnotStranded Media.\nWrite a ~{target_words} word article.\nCONTEXT: {full_context}\nPOOL: {cb_text}\nFORMAT: TITLE: ... CONTENT: ..."
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20240620",
        max_tokens=max_tokens,
        temperature=temperature,
        system=f"You are {writer['name']}, {writer['title']} at KnotStranded Media.",
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}]
    )
    return _process_response(message.content[0].text, news_item, writer, links)

def _generate_with_ollama(settings, news_item, writer, links, target_words):
    model_name = settings.get('ollama_model', 'llama3')
    target_url = "http://127.0.0.1:11434/api/generate"
    cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('clickbank', []))])
    full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
    
    prompt = f"You are {writer['name']}, {writer['title']} at KnotStranded Media.\nWrite a ~{target_words} word article.\nCONTEXT: {full_context}\nPOOL: {cb_text}\nFORMAT: TITLE: ... CONTENT: ..."
    
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": target_words * 4}
    }
    
    r = requests.post(target_url, json=payload, timeout=300)
    r.raise_for_status()
    return _process_response(r.json().get('response', ''), news_item, writer, links)

# Helper for other providers like Groq/OpenRouter
def _generate_with_openai_compatible(api_key, base_url, model, news_item, temperature, max_tokens, writer, links, target_words):
    from openai import OpenAI
    client = OpenAI(base_url=base_url, api_key=api_key)
    cb_text = "\n".join([f"[CB{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('clickbank', []))])
    full_context = news_item.get('full_context', news_item.get('snippet', 'No source available.'))
    prompt = f"You are {writer['name']}, {writer['title']} at KnotStranded Media.\nWrite a ~{target_words} word article.\nCONTEXT: {full_context}\nPOOL: {cb_text}\nFORMAT: TITLE: ... CONTENT: ..."
    
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens
    )
    return _process_response(response.choices[0].message.content, news_item, writer, links)

def _generate_with_groq(api_key, news_item, temperature, max_tokens, writer, links, target_words):
    return _generate_with_openai_compatible(api_key, "https://api.groq.com/openai/v1", "llama3-70b-8192", news_item, temperature, max_tokens, writer, links, target_words)

def _generate_with_openrouter(api_key, news_item, temperature, max_tokens, writer, links, target_words):
    return _generate_with_openai_compatible(api_key, "https://openrouter.ai/api/v1", "meta-llama/llama-3-70b-instruct", news_item, temperature, max_tokens, writer, links, target_words)

def _process_response(full_text, news_item, writer, links):
    title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', full_text, re.IGNORECASE)
    content_match = re.search(r'CONTENT:\s*(.+)', full_text, re.IGNORECASE | re.DOTALL)
    
    title = title_match.group(1).strip() if title_match else news_item['title']
    content = content_match.group(1).strip() if content_match else full_text
    
    # Process links
    for i, link in enumerate(links.get('clickbank', [])):
        content = re.sub(rf'\[?CB{i+1}\]?', f'<a href="{link["url"]}" class="affiliate-link cb-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        
    return {
        'title': title,
        'content': clean_blog_content(content, title),
        'writer': writer,
        'category': news_item.get('category', 'general'),
        'affiliate_links': links
    }
