import json
import requests
import base64
with open("blog_settings.json", "r") as f:
    key = json.load(f).get("gemini_api_key")

url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key={key}"
payload = {
    "instances": [
        {"prompt": "A cool futuristic robot dog"}
    ],
    "parameters": {
        "sampleCount": 1
    }
}
try:
    response = requests.post(url, json=payload, timeout=30)
    print("Status:", response.status_code)
    data = response.json()
    if "predictions" in data and len(data["predictions"]) > 0:
        b64_image = data["predictions"][0]["bytesBase64Encoded"]
        print("Success, length of base64:", len(b64_image))
    else:
        print("Failed. Response:", data)
except Exception as e:
    print("Exception", e)
