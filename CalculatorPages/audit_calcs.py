import glob, re

files = glob.glob("*.html")

print("--- CALCULATOR AUDIT REPORT ---")
issues_found = 0

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # Find all script usage of getElementById
    used_ids = re.findall(r"document\.getElementById\(['\"]([^'\"]+)['\"]\)", content)
    
    # Exclude global/shared IDs
    used_ids = [id for id in used_ids if id not in ['theme-icon', 'ad-post-result', 'feedbackName', 'feedbackEmail', 'feedbackComment', 'toolSearch']]
    
    # Find all explicitly declared IDs in the HTML DOM (very roughly)
    declared_ids = re.findall(r"id=['\"]([^'\"]+)['\"]", content)
    
    for uid in set(used_ids):
        if uid not in declared_ids:
            # Maybe it's defined globally like in sidebar.js, or we use a variable. Ensure it's static string.
            if uid.startswith('info-') or uid == 'email-gate' or uid == 'gate-email' or uid == 'gate-submit': continue
            print(f"[{file}] JS references id '{uid}' but it is NOT defined in the HTML!")
            issues_found += 1

    # Now look for result spans that are NEVER touched by JS!
    # usually: <span class="result-value" id="X"> 
    result_ids = re.findall(r'class="result-value"[^>]*id=["\']([^"\']+)["\']', content)
    for rid in result_ids:
        if rid not in used_ids:
            print(f"[{file}] Result span id '{rid}' exists but JS NEVER updates it!")
            issues_found += 1

if issues_found == 0:
    print("Zero missing or dead IDs found.")
