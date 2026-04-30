import re

with open('sidebar.js', 'r') as f:
    text = f.read()

old_padding = "        main { padding: 40px 200px !important; }"
new_padding = "        main { padding: 40px 200px !important; padding-top: calc(var(--header-height) + 40px) !important; }"

text = text.replace(old_padding, new_padding)

with open('sidebar.js', 'w') as f:
    f.write(text)

print("Fixed main padding for desktop!")
