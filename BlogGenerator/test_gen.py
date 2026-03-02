from dashboard_app import generate_featured_image_gemini
import json
with open("blog_settings.json", "r") as f:
    key = json.load(f).get("gemini_api_key")
res = generate_featured_image_gemini(key, "Test title", "test_id_123", "technology")
print("Response:", res)
