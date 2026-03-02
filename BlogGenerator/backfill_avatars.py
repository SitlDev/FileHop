import os
import re

POSTS_DIR = 'knot_storage'

def backfill_avatars():
    if not os.path.exists(POSTS_DIR):
        return

    files = [f for f in os.listdir(POSTS_DIR) if f.endswith('.html')]
    print(f"Updating author avatars in {len(files)} articles...")

    count = 0
    for filename in files:
        filepath = os.path.join(POSTS_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Update the author-avatar div to use an img tag
        # Look for the writer ID in the bio or meta if possible, or just parse the current initials
        # Actually, let's look for the author-avatar div
        
        # Pattern: <div class="author-avatar">[Initials]</div>
        # We want to replace it with: <div class="author-avatar"><img src="/avatars/writer_X.jpg" ...></div>
        
        # We need to target the writer ID. Since we don't have it easily, we'll try to guess from the text or just use a default
        # But wait, usually the articles have "Written by [Name]"
        writer_match = re.search(r'Written by (.*?)(?:</h4>|</p>)', content)
        writer_name = writer_match.group(1).strip() if writer_match else "Author"
        
        # Simple mapping for common names in this demo
        names_to_ids = {
            "Rex Mallory": 4,
            "Nova Xao": 5,
            "Silas Thorne": 1,
            "Elena Vance": 2,
            "Marcus Vane": 3
        }
        writer_id = names_to_ids.get(writer_name, 1)
        
        avatar_html = f'<div class="author-avatar"><img src="/avatars/writer_{writer_id}.jpg" alt="{writer_name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>'
        
        # Target the old div
        new_content = re.sub(r'<div class="author-avatar">.*?</div>', avatar_html, content, count=1)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1

    print(f"Done. Updated {count} author avatars.")

if __name__ == "__main__":
    backfill_avatars()
