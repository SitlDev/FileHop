import os

directory = "/Users/amn/Documents/GitHub/Claude/CalculatorPages"
files = [f for f in os.listdir(directory) if f.endswith(".html")]

for filename in files:
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    body_count = content.count("<body")
    html_count = content.count("<html")
    footer_count = content.count('class="site-footer"')
    
    if body_count > 1 or html_count > 1 or footer_count > 1:
        print(f"DUPLICATION DETECTED in {filename}: Body={body_count}, HTML={html_count}, Footer={footer_count}")
