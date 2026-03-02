import os
import time
import requests

BASE_URL = 'http://127.0.0.1:5000'
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'knotstranded2024')

CATEGORIES = [
    "us_politics", "news", "top_stories", "finance", "tech"
]

def login(session):
    resp = session.post(f"{BASE_URL}/login", data={'password': ADMIN_PASSWORD})
    if resp.status_code == 200 and 'Invalid password' not in resp.text:
        print("[+] Logged in successfully.")
        return True
    else:
        print("[-] Login failed.")
        return False

def clear_old_posts(session):
    print("[*] Clearing old posts...")
    resp = session.get(f"{BASE_URL}/api/archive")
    if resp.status_code == 200:
        posts = resp.json().get('posts', [])
        for post in posts:
            filename = post.get('filename')
            if filename:
                del_resp = session.delete(f"{BASE_URL}/api/archive/delete/{filename}")
                if del_resp.status_code == 200:
                    print(f"  [+] Deleted {filename}")
                else:
                    print(f"  [-] Failed to delete {filename}")
    else:
        print("[-] Failed to get archive.")

def populate_categories():
    with requests.Session() as s:
        if not login(s):
            return

        clear_old_posts(s)

        for category in CATEGORIES:
            print(f"\n{'='*40}")
            print(f"Populating category: {category}")
            print(f"{'='*40}")

            search_payload = {
                "ai_provider": "claude",
                "categories": [category],
                "num_results": 1,
                "is_trending": True,
                "query_filter": ""
            }
            print(f"[*] Crawling Top trends for {category}...")
            search_resp = s.post(f"{BASE_URL}/api/search", json=search_payload)
            if search_resp.status_code != 200:
                print(f"[!] Error during search: {search_resp.text}")
                continue
            
            data = search_resp.json()
            articles = data.get('news_items', [])
            print(f"[+] Found {len(articles)} articles.")
            
            if not articles:
                print("[!] Not enough articles.")
                continue
            
            selected_ids = [art['id'] for art in articles[:1]]
            
            generate_payload = {
                "config": search_payload,
                "selected_ids": selected_ids
            }
            
            print(f"[*] Generating & Publishing articles for {category}...")
            gen_resp = s.post(f"{BASE_URL}/api/generate", json=generate_payload)
            if gen_resp.status_code == 200:
                print(f"[+] Generation started for {category}!")
                
                while True:
                    time.sleep(10)
                    status_resp = s.get(f"{BASE_URL}/api/status")
                    if status_resp.status_code == 200:
                        status_data = status_resp.json()
                        st = status_data.get('status')
                        prog = status_data.get('progress', 0)
                        if st == 'complete':
                            print(f"[+] {category} generation completed.")
                            break
                        elif st == 'error':
                            print(f"[-] Error during generation: {status_data.get('error')}")
                            break
                        else:
                            print(f"    ...progress {prog}%")
            else:
                print(f"[-] Generate endpoint failed: {gen_resp.text}")
            
            print(f"[*] Sleeping 15 seconds before next category...")
            time.sleep(15)

if __name__ == "__main__":
    populate_categories()
    print("\n[+] Live blog population script completed.")
