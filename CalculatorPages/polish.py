import os
import re

# Standardized high-performance showTab function
ST_JS = """
        function showTab(id, event) {
            document.querySelectorAll('.calc-container').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.info-block').forEach(i => i.classList.remove('active'));

            const target = document.getElementById(id);
            if(target) target.classList.add('active');
            
            const info = document.getElementById('info-' + id);
            if (info) info.classList.add('active');

            if(event && event.currentTarget) {
                event.currentTarget.classList.add('active');
            } else {
                const btn = document.querySelector(`.tab-btn[onclick*="'${id}'"]`);
                if(btn) btn.classList.add('active');
            }
            document.querySelectorAll('.result-panel').forEach(p => p.classList.remove('visible'));
        }
"""

def polish_file(filename):
    filepath = os.path.join('/Users/amn/Documents/GitHub/Claude/CalculatorPages', filename)
    if not os.path.exists(filepath): return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Brutally remove all instances of showTab to avoid residue
    content = re.sub(r'function showTab\(id, [^{]*\)\s*{[\s\S]*?document\.querySelectorAll\(\'\.result-panel\'\)\.forEach\(p => p\.classList\.remove\(\'visible\'\)\);\s*}', '', content)
    # Extra safety for the "else residue"
    content = re.sub(r'\s*else\s*{\s*const btn = document\.querySelector\(\`\.tab-btn\[onclick\*=\"\'\${id}\'\"\]\`\);\s*if\(btn\) btn\.classList\.add\(\'active\'\);\s*}\s*document\.querySelectorAll\(\'\.result-panel\'\)\.forEach\(p => p\.classList\.remove\(\'visible\'\)\);\s*}', '', content)

    # 2. Re-inject clean version after <script>
    if '<script>' in content:
        content = re.sub(r'(<script>)', r'\1' + ST_JS, content)
    
    # 3. Clean up any duplicated "Feedback" comments
    content = re.sub(r'(<!-- Feedback & Community Thread -->\s*)+', r'<!-- Feedback & Community Thread -->\n', content)
    content = re.sub(r'(<!-- Feedback Section -->\s*)+', r'', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# All pages to polish
all_pages = [f for f in os.listdir('/Users/amn/Documents/GitHub/Claude/CalculatorPages') if f.endswith('.html') and f != 'index.html']
for p in all_pages:
    polish_file(p)
    print(f"Polished {p}")
