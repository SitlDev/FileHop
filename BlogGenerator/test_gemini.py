import google.generativeai as genai
import json

with open("blog_settings.json", "r") as f:
    key = json.load(f).get("gemini_api_key")

genai.configure(api_key=key)
try:
    imagen = genai.ImageGenerationModel("imagen-3.0-generate-001")
    result = imagen.generate_images(prompt="A test photo", number_of_images=1)
    if result and result.images:
        print("Success: Generated an image with Gemini.")
except AttributeError as a:
    print(f"Failed Attribute: {a}")
except Exception as e:
    print(f"Failed Other: {e}")
