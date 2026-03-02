import requests
import urllib.parse
prompt = urllib.parse.quote("a cool robot dog cyberpunk")
try:
    res = requests.get(f"https://image.pollinations.ai/prompt/{prompt}?width=1024&height=1024", verify=False)
    with open("test_polli.jpg", "wb") as f:
        f.write(res.content)
    print("Downloaded bytes:", len(res.content))
except Exception as e:
    print(e)
