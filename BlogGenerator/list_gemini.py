import json
import requests
with open("blog_settings.json", "r") as f:
    key = json.load(f).get("gemini_api_key")
res = requests.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}").json()
for m in res['models']:
    if 'image' in m['name'].lower() or 'imagen' in m['name'].lower():
        print(m['name'])
