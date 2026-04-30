import glob, re

for file in glob.glob("*.html"):
    content = open(file).read()
    res = re.findall(r"const\s+\w+\s*=\s*document\.getElementById\(['\"][a-zA-Z0-9_-]+['\"]\)\.value;", content)
    if res:
        print(f"[{file}] Raw .value without parseFloat : {len(res)} found")

