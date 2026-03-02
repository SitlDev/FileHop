import json
import requests
with open("blog_settings.json", "r") as f:
    key = json.load(f).get("gemini_api_key")

url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key={key}"

prompt = "Hyper-realistic, 8k, ultra-detailed editorial photography for a technology magazine cover: 'Test title'. Professional lighting, masterpiece, no text."
payload = {
    "instances": [{"prompt": prompt}],
    "parameters": {"sampleCount": 1}
}

response = requests.post(url, json=payload, timeout=45)
print("Status code:", response.status_code)
try:
    data = response.json()
    print("Response JSON keys:", data.keys())
    if "predictions" not in data:
        print("Full data:", data)
except Exception as e:
    print("Failed to parse JSON:", e)
    print("Raw text:", response.text)
