#!/usr/bin/env python3
"""
Fix all YourCalc HTML pages:
  1. Broken tab onclick: onclick=\\\"showTab(...)\\\" → onclick="showTab(...)"
  2. Duplicate showTab() definition in <head> script block
  3. Missing seo-section/seo-grid/info-block CSS
  4. Wrong community discussion "Marcus R. / Audio room mode" placeholder comment
"""

import os
import re
import glob

# ── CSS to inject if seo-grid is used but seo-section CSS is missing ──────────
SEO_CSS = """
        .seo-section { margin-top: 64px; }
        .seo-section h2 { font-size: 28px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em; }
        .seo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
        .seo-grid > div { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .seo-grid h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--text); }
        .seo-grid p { font-size: 14px; color: var(--muted); line-height: 1.7; }

        .info-block { display: none; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 40px; margin-top: 32px; animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .info-block.active { display: block; }
        .info-block h2 { font-size: 24px; margin-bottom: 16px; }
"""

# ── Page-specific community thread replacements ────────────────────────────────
COMMENTS = {
    'science.html':  ('<strong>Wei L.</strong> • 5 days ago',
                      '"The half-life calculator is brilliant for my chemistry students. Would love a molar mass / periodic table lookup tool!"'),
    'life.html':     ('<strong>Rachel M.</strong> • 3 days ago',
                      '"The retirement date calculator made me realize I need to start saving more aggressively. Really put things in perspective!"'),
    'career.html':   ('<strong>James O.</strong> • 2 days ago',
                      '"The salary negotiation tool helped me benchmark my worth before a big interview. Ended up getting $12k more than the initial offer!"'),
    'unit-converters.html': ('<strong>Tomás V.</strong> • 1 day ago',
                      '"The unit converter is the fastest I\'ve found online. Wish there was a cooking measurement tab — cups to ml, etc.!"'),
    'gaming.html':   ('<strong>Kai R.</strong> • 6 hours ago',
                      '"The FPS to ms converter is exactly what I needed for monitor shopping. Could you add a GPU benchmark score lookup?"'),
    'academic.html': ('<strong>Priya S.</strong> • 4 days ago',
                      '"The GPA calculator got me through finals week. Would love a weighted vs unweighted breakdown option!"'),
    'engineering.html': ('<strong>Nikos P.</strong> • 3 days ago',
                      '"The beam deflection calculator saved hours of manual work on a client project. Structural engineers will love this site."'),
    'green.html':    ('<strong>Clara E.</strong> • 2 days ago',
                      '"The carbon footprint calculator was enlightening — didn\'t realize how much my commute contributes. Would love an offset suggestions feature!"'),
    'invest.html':   ('<strong>David H.</strong> • 1 day ago',
                      '"The compound interest calculator finally helped me convince my partner to max out our Roth IRA contributions. Visual timeline would be awesome!"'),
    'business.html': ('<strong>Amara J.</strong> • 3 days ago',
                      '"The runway calculator is a must-have for any startup founder. Our team uses it every board meeting!"'),
    'ai-costs.html': ('<strong>Lin C.</strong> • 2 days ago',
                      '"This helped me finally compare GPT-4o vs Claude for my RAG pipeline costs. Would love a per-token breakdown by use case!"'),
    'audio.html':    ('<strong>Diego F.</strong> • 1 day ago',
                      '"The RT60 room calculator is spot-on for my recording studio treatment plan. A speaker placement visualizer would be the dream!"'),
    'auto.html':     ('<strong>Raj M.</strong> • 4 days ago',
                      '"The lease vs buy calculator made it crystal clear I should buy. Saved me from a bad deal at the dealership!"'),
    'diy.html':      ('<strong>Sam W.</strong> • 5 days ago',
                      '"The tile calculator saved me from buying 20% too many tiles. Would love a paint coverage estimator for walls with windows!"'),
    'finance.html':  ('<strong>Olivia K.</strong> • 3 days ago',
                      '"The mortgage amortization breakdown is the clearest I\'ve seen. Finally understand how much interest I actually pay each year!"'),
    'health.html':   ('<strong>Marcus T.</strong> • 2 days ago',
                      '"The TDEE calculator matched my dietitian\'s numbers almost exactly. Would love a macro split builder added to this page!"'),
    'psych.html':    ('<strong>Yuki N.</strong> • 6 hours ago',
                      '"The stress index tool is surprisingly accurate. Would love an evidence-based recommendation section linked to each result!"'),
    'real-estate.html': ('<strong>Carla B.</strong> • 1 day ago',
                      '"The rent vs buy calculator finally convinced my husband we\'re ready to buy. The 5-year cost comparison is really powerful!"'),
    'spiritual.html': ('<strong>Anika R.</strong> • 3 days ago',
                       '"The prayer time calculator is accurate for my city. Would love a qibla direction tool added!"'),
    'survival.html': ('<strong>Jake L.</strong> • 2 days ago',
                      '"The water per day survival calculator is essential for my hiking prep. Would love a food calorie estimation for multi-day trips!"'),
}

STALE_COMMENT_AUTHOR  = 'Marcus R.'
STALE_COMMENT_TEXT    = "Audio room mode"  # substring to detect stale comment

def has_broken_onclick(content):
    return '\\"showTab' in content or "\\\"showTab" in content

def fix_onclick(content):
    # Replace escaped-quote onclick patterns
    content = re.sub(r'onclick=\\"showTab\(', 'onclick="showTab(', content)
    content = re.sub(r'onclick=\\\"showTab\(', 'onclick="showTab(', content)
    # Close: closing escaped quotes → regular closing quote
    # The pattern after the arg list:  event)\\\" → event)"
    content = re.sub(r'(onclick="showTab\([^"]+?), event\)\\"', r'\1, event)"', content)
    content = re.sub(r'(onclick="showTab\([^"]+?), event\)\\\"', r'\1, event)"', content)
    # Simpler: replace any remaining \\\" that follow an opening onclick="
    # Use a single broad replacement after the above
    content = content.replace('\\">', '">')
    content = content.replace('\\\">', '">')
    return content

# Pattern: the full showTab function block inside a <script> in <head>
HEAD_SHOWTAB_PATTERN = re.compile(
    r'(\s*function showTab\(id, event\) \{.*?\.forEach\(p => p\.classList\.remove\(\'visible\'\)\);\s*\}\s*\n)',
    re.DOTALL
)

def remove_head_showtab(content):
    """Remove the FIRST occurrence of a showTab block (the one in <head>).
    We identify the <head> block by its position relative to </head>."""
    head_end = content.find('</head>')
    if head_end == -1:
        return content
    head_section = content[:head_end]
    body_section = content[head_end:]

    # Find and remove showTab block from head
    match = HEAD_SHOWTAB_PATTERN.search(head_section)
    if match:
        head_section = head_section[:match.start()] + head_section[match.end():]

    return head_section + body_section

def needs_seo_css(content):
    return 'seo-grid' in content and '.seo-grid {' not in content and '.seo-grid{' not in content

def inject_seo_css(content):
    """Insert SEO CSS block before the @media (max-width: 1024px) rule."""
    # Ensure responsive media query also includes .seo-grid
    content = content.replace(
        '.input-grid, .result-grid { grid-template-columns: 1fr; }',
        '.input-grid, .result-grid, .seo-grid { grid-template-columns: 1fr; }'
    )
    # Insert SEO CSS block before the responsive media query
    target = '        @media (max-width: 1024px) {'
    idx = content.find(target)
    if idx != -1:
        content = content[:idx] + SEO_CSS + content[idx:]
    return content

def fix_community_comment(content, filename):
    if STALE_COMMENT_TEXT not in content:
        return content
    basename = os.path.basename(filename)
    if basename not in COMMENTS:
        return content
    author_tag, comment_text = COMMENTS[basename]
    # Replace the stale author div
    content = re.sub(
        r'<strong>Marcus R\.</strong> • 2 days ago',
        author_tag,
        content,
        count=1
    )
    # Replace the stale comment text
    content = re.sub(
        r'"The new \'Audio room mode\' tool is incredibly accurate for my home studio setup\. Would love to see a speaker placement calculator next!"',
        f'"{comment_text[1:-1]}"',  # strip outer quotes since we're replacing the inner text
        content,
        count=1
    )
    return content

def fix_body_showtab_selector(content):
    """In the body's showTab function, use broader selector so it works with non-escaped onclick."""
    # Fix the querySelector that was using .tab-btn[onclick*=...] — make it broader
    content = content.replace(
        "const btn = document.querySelector(`.tab-btn[onclick*=\"'${id}'\"]`);",
        "const btn = document.querySelector(`[onclick*=\"'${id}'\"]`);"
    )
    return content

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    content = original
    changed = False
    changes = []

    # 1. Fix broken onclick
    if has_broken_onclick(content):
        content = fix_onclick(content)
        changes.append('fixed broken onclick escaping')
        changed = True

    # 2. Remove duplicate showTab from <head>
    head_end = content.find('</head>')
    if head_end != -1 and 'function showTab' in content[:head_end]:
        content = remove_head_showtab(content)
        changes.append('removed duplicate showTab from <head>')
        changed = True

    # 3. Inject SEO/info-block CSS if missing
    if needs_seo_css(content):
        content = inject_seo_css(content)
        changes.append('injected seo-section/seo-grid/info-block CSS')
        changed = True

    # 4. Fix stale community comment
    if STALE_COMMENT_TEXT in content:
        new_content = fix_community_comment(content, filepath)
        if new_content != content:
            content = new_content
            changes.append('updated community discussion comment')
            changed = True

    # 5. Fix body showTab selector
    old_selector = ".tab-btn[onclick*=\"'${id}'\"]"
    if old_selector in content:
        content = fix_body_showtab_selector(content)
        changes.append('improved showTab querySelector scope')
        changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'✅ {os.path.basename(filepath)}: {" | ".join(changes)}')
    else:
        print(f'   {os.path.basename(filepath)}: no changes needed')

    return changed

def main():
    html_files = sorted(glob.glob('/Users/amn/Documents/GitHub/Claude/CalculatorPages/*.html'))
    # Skip index/about/privacy/terms/branding_preview as they don't use showTab
    skip = {'index.html', 'about.html', 'privacy.html', 'terms.html', 'branding_preview.html'}
    
    fixed = 0
    for filepath in html_files:
        if os.path.basename(filepath) in skip:
            continue
        if process_file(filepath):
            fixed += 1

    print(f'\n🎉 Done — {fixed} file(s) patched.')

if __name__ == '__main__':
    main()
