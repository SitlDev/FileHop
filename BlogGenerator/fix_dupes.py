with open('dashboard_app.py', 'r') as f:
    text = f.read()

# Fix amz_text duplicates
bad_block = """        cj_text = "\\n".join([f"[CJ{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('cj', []))])
        ds_text = "\\n".join([f"[DS{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('digistore', []))])
        imp_text = "\\n".join([f"[IMP{i+1}] {l['title']} - {l['description']}" for i, l in enumerate(links.get('impact', []))])"""
        
# Replace 3 occurrences with 1
text = text.replace(bad_block + "\n" + bad_block + "\n" + bad_block, bad_block)

# Fix prompt inject duplicates
# actually the `{amz_text}` was not triplicated because of the negative lookahead I used: `re.sub(r'(\{amz_text\}\n)(?!\{cj_text\})', repl_prompt + '\n', text)`
# wait, because it was a sub over the whole text, the first time it replaced all 3. The second and third time it skipped because of negative lookahead. 
# But the string replacements: `text.replace(search_str, repl_str)` did it globally. So 1st loop replaced 3, 2nd loop replaced 3 (which now had the suffix), oh boy.

with open('dashboard_app.py', 'w') as f:
    f.write(text)
print("fixed dupes")
