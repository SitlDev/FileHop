import os

def fix_mangled_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find the first </html>
    first_html_idx = -1
    for i, line in enumerate(lines):
        if '</html>' in line:
            first_html_idx = i
            break
    
    if first_html_idx != -1 and first_html_idx < len(lines) - 1:
        print(f"Fixing mangled tail in {filepath}")
        # Keep everything up to the first </html>
        new_content = "".join(lines[:first_html_idx + 1])
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

def main():
    root_dir = '.'
    for filename in os.listdir(root_dir):
        if filename.endswith('.html'):
            fix_mangled_file(os.path.join(root_dir, filename))

if __name__ == "__main__":
    main()
