import re

with open('dashboard_app.py', 'r') as f:
    text = f.read()

# We need to add the new providers to the prompt generation in claude, openai, ollama

for provider in ['claude', 'openai', 'ollama']:
    # Add prompt lines
    search_str = f"amz_text = \"\\n\".join([f\"[AMZ{{i+1}}] {{l['title']}} - {{l['description']}}\" for i, l in enumerate(links.get('amazon', []))])"
    
    repl_str = f"""amz_text = "\\n".join([f"[AMZ{{i+1}}] {{l['title']}} - {{l['description']}}" for i, l in enumerate(links.get('amazon', []))])
        cj_text = "\\n".join([f"[CJ{{i+1}}] {{l['title']}} - {{l['description']}}" for i, l in enumerate(links.get('cj', []))])
        ds_text = "\\n".join([f"[DS{{i+1}}] {{l['title']}} - {{l['description']}}" for i, l in enumerate(links.get('digistore', []))])
        imp_text = "\\n".join([f"[IMP{{i+1}}] {{l['title']}} - {{l['description']}}" for i, l in enumerate(links.get('impact', []))])"""
    text = text.replace(search_str, repl_str)

    # Add to prompt inject
    search_prompt = "{amz_text}"
    repl_prompt = "{amz_text}\n{cj_text}\n{ds_text}\n{imp_text}"
    # only replace the exact instances we've matched
    text = re.sub(r'(\{amz_text\}\n)(?!\{cj_text\})', repl_prompt + '\n', text)

    # Replace generated tags
    search_sub = """content = re.sub(rf'(?:\\*\\*?)?\\[?SUB{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link sub-link">{link["title"]}</a>', content, flags=re.IGNORECASE)"""
    
    repl_sub = """content = re.sub(rf'(?:\\*\\*?)?\\[?SUB{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link sub-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('cj', [])):
            content = re.sub(rf'(?:\\*\\*?)?\\[?CJ{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link cj-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('digistore', [])):
            content = re.sub(rf'(?:\\*\\*?)?\\[?DS{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link ds-link">{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('impact', [])):
            content = re.sub(rf'(?:\\*\\*?)?\\[?IMP{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link imp-link">{link["title"]}</a>', content, flags=re.IGNORECASE)"""
    text = text.replace(search_sub, repl_sub)

    # for img variant (Ollama / V2 generator)
    search_sub_img = """content = re.sub(rf'(?:\\*\\*?)?\\[?SUB{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link sub-link"{img_attr}>{link["title"]}</a>', content, flags=re.IGNORECASE)"""
    repl_sub_img = """content = re.sub(rf'(?:\\*\\*?)?\\[?SUB{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link sub-link"{img_attr}>{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('cj', [])):
            img_attr = f' data-img="{link.get("image")}"' if link.get("image") else ""
            content = re.sub(rf'(?:\\*\\*?)?\\[?CJ{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link cj-link"{img_attr}>{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('digistore', [])):
            img_attr = f' data-img="{link.get("image")}"' if link.get("image") else ""
            content = re.sub(rf'(?:\\*\\*?)?\\[?DS{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link ds-link"{img_attr}>{link["title"]}</a>', content, flags=re.IGNORECASE)
        for i, link in enumerate(links.get('impact', [])):
            img_attr = f' data-img="{link.get("image")}"' if link.get("image") else ""
            content = re.sub(rf'(?:\\*\\*?)?\\[?IMP{i+1}[^\\]\\n]*\\]?(?:\\*\\*?)?', f'<a href="{link["url"]}" class="affiliate-link imp-link"{img_attr}>{link["title"]}</a>', content, flags=re.IGNORECASE)"""
    text = text.replace(search_sub_img, repl_sub_img)

with open('dashboard_app.py', 'w') as f:
    f.write(text)
print("patch generated")
