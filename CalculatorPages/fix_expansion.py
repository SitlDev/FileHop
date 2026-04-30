import os
import re

def clean_file(path):
    with open(path, "r") as f:
        content = f.read()
    content = re.sub(r'<div class="deep-dive".*?</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<h3>Worked Example</h3>.*?</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div class="related-guide".*?</div>', '', content, flags=re.DOTALL)
    if "</html>" in content:
        parts = content.split("</html>")
        content = parts[0] + "</html>"
    with open(path, "w") as f:
        f.write(content)

def expand_properly(path, target_id, dive_html, guide_link=None):
    with open(path, "r") as f:
        content = f.read()
    
    # Add Related Guide link if provided
    if guide_link:
        guide_html = f"""
        <div class="related-guide" style="margin-top: 24px; padding: 16px; background: rgba(245, 166, 35, 0.05); border-radius: 12px; display: flex; align-items: center; gap: 12px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span style="font-size: 14px; font-weight: 600;">Related Guide: <a href="blog/{guide_link}" style="color: var(--accent); text-decoration: none;">{guide_link.replace('-', ' ').replace('.html', '').title()}</a></span>
        </div>
        """
        dive_html = guide_html + dive_html

    pattern = f'id="{target_id}"'
    start_idx = content.find(pattern)
    if start_idx == -1: return

    next_section = content.find('<div id=', start_idx + 1)
    if next_section == -1: next_section = content.find('</main>', start_idx)
    end_div = content.rfind('</div>', start_idx, next_section)
    
    if end_div != -1:
        content = content[:end_div] + dive_html + content[end_div:]
        
    with open(path, "w") as f:
        f.write(content)

# Dives definitions...
mortgage_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">The Math of Amortization</h2>
        <p>Mortgage payments are calculated using the standard annuity formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]. Interest is calculated monthly on the remaining balance. In the early years of a 30-year loan, the majority of your payment goes to interest rather than principal.</p>
    </div>
"""

compound_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">The Power of Compounding</h2>
        <p>The future value of an investment grows exponentially. Compounding frequency (daily, monthly, quarterly) determines how often interest is added to the principal. More frequent compounding leads to higher total returns over long horizons.</p>
    </div>
"""

fire_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">Financial Independence Math</h2>
        <p>The FIRE Number is based on the Trinity Study's 4% Safe Withdrawal Rate. By saving 25 times your annual expenses, you can theoretically live off the investment returns indefinitely, adjusted for inflation.</p>
    </div>
"""

bmi_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">BMI Limitations</h2>
        <p>Body Mass Index is a height-to-weight ratio. It does not account for bone density, muscle mass, or fat distribution. Athletes often have "Obese" BMIs despite low body fat percentages.</p>
    </div>
"""

tdee_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">Metabolic Expenditure</h2>
        <p>TDEE accounts for your Basal Metabolic Rate (BMR) plus physical activity. Understanding your TDEE is essential for managing weight, as it defines the "maintenance" calorie level.</p>
    </div>
"""

runway_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">Startup Runway Strategy</h2>
        <p>Runway is the lifeblood of a startup. It is calculated by dividing current cash by net monthly burn. Founders should aim for 18-24 months of runway to allow for product-market fit and fundraising cycles.</p>
    </div>
"""

llc_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">S-Corp Tax Efficiency</h2>
        <p>Electing S-Corp status allows business owners to split income between salary and distributions. Distributions are not subject to the 15.3% self-employment tax, potentially saving thousands annually.</p>
    </div>
"""

crcl_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 20px;">Clinical Renal Function</h2>
        <p>Creatinine Clearance (CrCl) estimates the rate at which kidneys filter blood. The Cockcroft-Gault equation is the clinical standard for drug dosing adjustments in patients with renal impairment.</p>
    </div>
"""

if __name__ == "__main__":
    files_to_clean = ["finance.html", "health.html", "business.html", "legal-tax.html", "medical.html"]
    for f in files_to_clean:
        clean_file(f)
    
    expand_properly("finance.html", "mortgage", mortgage_dive, "mortgage-amortization-explained.html")
    expand_properly("finance.html", "compound", compound_dive, "how-compounding-frequency-affects-returns.html")
    expand_properly("finance.html", "fire", fire_dive, "how-to-calculate-your-fire-number.html")
    
    expand_properly("health.html", "bmi", bmi_dive, "bmi-limitations-what-it-misses.html")
    expand_properly("health.html", "tdee", tdee_dive, "what-is-tdee-and-why-it-matters.html")
    
    expand_properly("business.html", "runway", runway_dive, "how-to-read-your-burn-rate.html")
    
    expand_properly("legal-tax.html", "llcscorp", llc_dive, "llc-vs-scorp-which-saves-more-tax.html")
    
    expand_properly("medical.html", "crcl", crcl_dive, "cockcroft-gault-equation-for-clinicians.html")
    
    print("Cleaned and expanded with cross-links.")
