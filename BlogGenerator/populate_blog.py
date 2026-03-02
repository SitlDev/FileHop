import os
import time
import requests

# Base URL of the deployed application (or local if testing)
BASE_URL = os.environ.get('APP_URL', 'http://localhost:5000')
# Set this to the admin password configured in your environment
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'knotstranded2024')

CATEGORIES = [
    "tech", "finance", "movies", "tv", "music", "celebrity",
    "awards", "streaming", "books", "gaming", "health", 
    "science", "sports", "politics", "us_politics", "lifestyle", "local"
]

def login(session):
    resp = session.post(f"{BASE_URL}/login", data={'password': ADMIN_PASSWORD})
    if resp.status_code == 200 and 'Invalid password' not in resp.text:
        print("[+] Logged in successfully.")
        return True
    else:
        print("[-] Login failed.")
        return False

def populate_categories():
    with requests.Session() as s:
        if not login(s):
            return

        for category in CATEGORIES:
            print(f"\n{'='*40}")
            print(f"Populating category: {category}")
            print(f"{'='*40}")

            # 1. Search for trending articles in this category
            search_payload = {
                "ai_provider": "claude",
                "categories": [category],
                "num_results": 10,
                "is_trending": False,
                "query_filter": ""
            }
            print(f"[*] Crawling Top 10 trends for {category}...")
            search_resp = s.post(f"{BASE_URL}/api/search", json=search_payload)
            if search_resp.status_code != 200:
                print(f"[!] Error during search: {search_resp.text}")
                continue
            
            data = search_resp.json()
            articles = data.get('news_items', [])
            print(f"[+] Found {len(articles)} articles.")
            
            if not articles:
                print("[!] Not enough articles to populate right now.")
                continue
            
            selected_ids = [art['id'] for art in articles]
            
            # 2. Trigger generation and auto-publish
            generate_payload = {
                "config": search_payload,
                "selected_ids": selected_ids
            }
            
            print(f"[*] Generating & Publishing {len(selected_ids)} articles for {category}...")
            gen_resp = s.post(f"{BASE_URL}/api/generate", json=generate_payload)
            if gen_resp.status_code == 200:
                print(f"[+] Generation started for {category}!")
                
                # Wait for generation to finish before moving to the next category
                # Checking status
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
            
            print(f"[*] Sleeping 30 seconds before next category to avoid rate limits...")
            time.sleep(30)

if __name__ == "__main__":
    populate_categories()
    print("\n[+] Blog population script completed.")
