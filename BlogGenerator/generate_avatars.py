import os
import requests
import random

GENERATED_IMG_DIR = 'knot_images'
AVATARS_DIR = os.path.join(GENERATED_IMG_DIR, 'avatars')

def generate():
    os.makedirs(AVATARS_DIR, exist_ok=True)
    
    # We'll generate avatars for IDs 1 to 10 to be safe
    print("Generating fallback avatars using Unsplash...")
    
    for i in range(1, 21):
        filename = f"writer_{i}.jpg"
        filepath = os.path.join(AVATARS_DIR, filename)
        
        # High-end portrait from Unsplash
        url = f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1600000000000)}?auto=format&fit=crop&q=80&w=200&h=200"
        # Actually better to use a known good portrait seed
        url = f"https://i.pravatar.cc/300?u={i}" # Trusted avatar service
        
        try:
            print(f"Fetching avatar {i}...")
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(r.content)
                print(f"✅ Saved {filename}")
            else:
                print(f"❌ Failed {filename} (HTTP {r.status_code})")
        except Exception as e:
            print(f"❌ Error {filename}: {e}")

if __name__ == "__main__":
    generate()
