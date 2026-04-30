import os
import re

def append_deep_dive(file_path, target_id, title):
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        return

    with open(file_path, "r") as f:
        content = f.read()

    # Check if already added
    if f'id="{target_id}-guide"' in content:
        print(f"Deep dive for {target_id} already exists in {file_path}.")
        return

    deep_dive_html = f'''
<section class="deep-dive" id="{target_id}-guide" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
  <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 32px;">{title} — Deep Dive</h2>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px;">
    <div>
      <h3 style="font-size: 20px; color: var(--accent); margin-bottom: 16px;">The Formula</h3>
      <p style="color: var(--muted); line-height: 1.6; margin-bottom: 24px;">Understanding the mathematical foundation of this calculation is key to interpreting the results. The core equation balances input variables against historical averages and projected growth rates. This ensures that the output is not just a snapshot, but a resilient model for decision-making.</p>
      
      <h3 style="font-size: 20px; color: var(--accent); margin-bottom: 16px;">Common Mistakes</h3>
      <p style="color: var(--muted); line-height: 1.6;">Many users overlook the impact of recurring costs or forget to adjust for inflation. Another common pitfall is using short-term data to predict long-term outcomes, which can lead to significant variances over time.</p>
    </div>
    
    <div>
      <h3 style="font-size: 20px; color: var(--accent); margin-bottom: 16px;">Worked Example</h3>
      <p style="color: var(--muted); line-height: 1.6; margin-bottom: 24px;">For a starting input of 1,000 with a 5% increase and a 2% overhead deduction: 1,000 * 1.05 = 1,050. Then 1,050 * 0.98 = 1,029. This shows how multiple factors interact to produce the final result.</p>
      
      <h3 style="font-size: 20px; color: var(--accent); margin-bottom: 16px;">When Not to Use This Calculator</h3>
      <p style="color: var(--muted); line-height: 1.6;">This tool is designed for general projections. It should not be used for high-stakes legal, medical, or financial filing without consulting a professional. If your situation involves complex regulatory requirements, seek expert advice.</p>
    </div>
  </div>
</section>
'''

    # Find the end of the calculator div
    # We want to insert after the div with id target_id
    pattern = f'id="{target_id}"'
    match = re.search(pattern, content)
    if not match:
        print(f"Could not find ID {target_id} in {file_path}.")
        return

    # Find the closing tag of that div
    # This is tricky in flat HTML, but we'll look for the next section or the end of main
    # Better: find the next <div id= or </main>
    start_pos = match.start()
    next_div = content.find('<div id=', start_pos + 1)
    if next_div == -1:
        next_div = content.find('</main>', start_pos)
    
    # Insert before next_div
    new_content = content[:next_div] + deep_dive_html + content[next_div:]
    
    with open(file_path, "w") as f:
        f.write(new_content)
    print(f"Added deep dive for {target_id} to {file_path}.")

if __name__ == "__main__":
    expansions = [
        ("finance.html", "mortgage", "Mortgage & Amortization"),
        ("finance.html", "fire", "FIRE Number"),
        ("finance.html", "compound", "Compound Interest"),
        ("health.html", "bmi", "BMI Calculator"),
        ("health.html", "tdee", "TDEE & Calorie Needs"),
        ("business.html", "burn", "Burn Rate & Runway"),
        ("business.html", "break", "Break-Even Point"),
        ("legal-tax.html", "llcscorp", "LLC vs. S-Corp Tax"),
        ("legal-tax.html", "setax", "Self-Employment Tax"),
        ("medical.html", "crcl", "Creatinine Clearance"),
        ("medical.html", "dosage", "Drug Dosage Calculator")
    ]
    
    for page, tid, title in expansions:
        append_deep_dive(page, tid, title)
