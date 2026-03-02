import os
import requests

writer_genders = {
    1: 'women', # Marcella
    2: 'men',   # Felix
    3: 'women', # Diana
    4: 'men',   # Rex
    5: 'women', # Paloma
    6: 'men',   # Silas
    7: 'women', # Evelyn
    8: 'men',   # Aris
    9: 'women', # Sloane
    10: 'women', # Nova
    11: 'men',   # Grant
    12: 'women', # Aria
    13: 'men',   # Atlas
    14: 'women', # Beatrix
    15: 'men',   # Detective Miller
    16: 'men',   # Cyrus
    17: 'women', # Luna
    18: 'men',   # Jax
    19: 'women', # Librarian
    20: 'men',   # Kai
}

avatar_dir = 'knot_images/avatars'
os.makedirs(avatar_dir, exist_ok=True)

for wid, gender in writer_genders.items():
    # Use their ID as the randomuser.me image index for consistency
    # randomuser.me has 1-99 limits.
    index = (wid % 90) + 1
    url = f"https://randomuser.me/api/portraits/{gender}/{index}.jpg"
    filepath = os.path.join(avatar_dir, f"writer_{wid}.jpg")
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(r.content)
            print(f"Fixed writer {wid} ({gender})")
    except Exception as e:
        print(f"Error {wid}: {e}")

