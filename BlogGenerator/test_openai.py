import openai
import os
import json

with open("blog_settings.json", "r") as f:
    key = json.load(f).get("openai_api_key")

openai.api_key = key
try:
    response = openai.images.generate(
        model="dall-e-3",
        prompt="Test prompt",
        size="1024x1024",
        quality="standard",
        n=1
    )
    print("Success:", response.data[0].url)
except Exception as e:
    print("Failed:", e)
