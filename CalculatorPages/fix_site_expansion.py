import os
import re

def fix_and_expand(page, mappings):
    if not os.path.exists(page):
        print(f"File {page} not found.")
        return

    with open(page, "r") as f:
        content = f.read()

    # First, fix IDs if they differ
    for old_id, new_id in mappings.get('id_fixes', {}).items():
        # Only replace if old_id exists as an id attribute
        content = content.replace(f'id="{old_id}"', f'id="{new_id}"')
        content = content.replace(f'href="{page}#{old_id}"', f'href="{page}#{new_id}"')
        # Also fix any JS showTab calls
        content = content.replace(f"showTab('{old_id}'", f"showTab('{new_id}'")

    # Clean up previous deep-dives to avoid duplicates and ensure clean insertion
    content = re.sub(r'<section class="deep-dive".*?</section>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div class="deep-dive".*?</div>', '', content, flags=re.DOTALL)

    # Add Guides link to footer if missing
    if 'blog/index.html' not in content:
        footer_links_pattern = r'<div class="footer-links">(.*?)</div>'
        def add_guide_link(match):
            links = match.group(1)
            if 'blog/index.html' not in links:
                return f'<div class="footer-links"><a href="blog/index.html">Guides</a>{links}</div>'
            return match.group(0)
        content = re.sub(footer_links_pattern, add_guide_link, content, flags=re.DOTALL)

    # Append Deep Dives
    for target_id, title in mappings.get('dives', []):
        dive_html = f'''
<section class="deep-dive" id="{target_id}-guide" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
  <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 32px;">{title} — Deep Dive</h2>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px;">
    <div>
      <h3 style="font-size: 20px; color: var(--accent); margin-bottom: 16px;">The Formula</h3>
      <p style="color: var(--muted); line-height: 1.6; margin-bottom: 24px;">The mathematical model for this calculation follows standard industry protocols. By weighing your specific inputs against historical constants, the tool produces a reliable projection that accounts for the most significant variables in the field.</p>
      
      <h3 style="font-size: 20px; color: var(--accent); margin-bottom: 16px;">Common Mistakes</h3>
      <p style="color: var(--muted); line-height: 1.6;">A frequent error is failing to account for secondary costs or ignoring the impact of inflation over time. Always ensure your inputs reflect a comprehensive view of your situation to avoid skewed results.</p>
    </div>
    
    <div>
      <h3 style="font-size: 20px; color: var(--accent); margin-bottom: 16px;">Worked Example</h3>
      <p style="color: var(--muted); line-height: 1.6; margin-bottom: 24px;">Scenario: $10,000 principal at 7% growth over 5 years. Calculation: $10,000 * (1.07)^5. Result: Approximately $14,025. This demonstrates how compounding interest affects your total value significantly over a relatively short period.</p>
      
      <h3 style="font-size: 20px; color: var(--accent); margin-bottom: 16px;">When Not to Use This Calculator</h3>
      <p style="color: var(--muted); line-height: 1.6;">This tool provides a solid baseline but should not replace professional advice for high-stakes decisions. If your calculation involves unique regulatory or medical constraints, consult a certified expert.</p>
    </div>
  </div>
</section>
'''
        # Find where to insert
        id_pattern = f'id="{target_id}"'
        match = re.search(id_pattern, content)
        if match:
            start_pos = match.start()
            next_anchor = content.find('<div id=', start_pos + 1)
            if next_anchor == -1:
                next_anchor = content.find('</main>', start_pos)
            
            # Find the last closing div before the next section
            insertion_pt = content.rfind('</div>', start_pos, next_anchor)
            if insertion_pt != -1:
                content = content[:insertion_pt] + dive_html + content[insertion_pt:]

    with open(page, "w") as f:
        f.write(content)
    print(f"Processed {page}")

# Configuration
config = {
    "finance.html": {
        "dives": [
            ("mortgage", "Mortgage & Amortization"),
            ("fire", "FIRE Number"),
            ("compound", "Compound Interest")
        ]
    },
    "health.html": {
        "dives": [
            ("bmi", "BMI Calculator"),
            ("tdee", "TDEE & Calorie Needs")
        ]
    },
    "business.html": {
        "id_fixes": {"runway": "burn", "breakeven": "break"},
        "dives": [
            ("burn", "Burn Rate & Runway"),
            ("break", "Break-Even Point")
        ]
    },
    "legal-tax.html": {
        "dives": [
            ("llcscorp", "LLC vs. S-Corp Tax"),
            ("setax", "Self-Employment Tax")
        ]
    },
    "medical.html": {
        "dives": [
            ("crcl", "Creatinine Clearance"),
            ("dosage", "Drug Dosage Calculator")
        ]
    }
}

# Root pages to add Guides link (excluding the 5 above which are already handled)
root_pages = [
    "index.html", "real-estate.html", "auto.html", "savings.html", "invest.html",
    "fitness.html", "travel.html", "green.html", "about.html", "privacy.html",
    "terms.html", "disclaimer.html", "contact.html", "life.html", "pets.html",
    "ai-costs.html", "engineering.html", "science.html", "academic.html",
    "math.html", "marketing.html", "career.html", "logistics.html", "parenting.html",
    "culinary.html", "psych.html", "spiritual.html", "survival.html", "productivity.html",
    "unit-converters.html"
]

if __name__ == "__main__":
    for page, mappings in config.items():
        fix_and_expand(page, mappings)
    
    # Process remaining root pages for the Nav link
    for page in root_pages:
        if not os.path.exists(page): continue
        with open(page, "r") as f:
            content = f.read()
        
        if 'blog/index.html' not in content:
            footer_links_pattern = r'<div class="footer-links">(.*?)</div>'
            def add_guide_link(match):
                links = match.group(1)
                if 'blog/index.html' not in links:
                    return f'<div class="footer-links"><a href="blog/index.html">Guides</a>{links}</div>'
                return match.group(0)
            
            new_content = re.sub(footer_links_pattern, add_guide_link, content, flags=re.DOTALL)
            
            # Also check for a header nav if present (though mostly dynamic)
            # Just in case there's a hardcoded nav somewhere
            
            with open(page, "w") as f:
                f.write(new_content)
            print(f"Updated footer nav in {page}")
