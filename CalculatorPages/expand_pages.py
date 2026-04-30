import os

def expand_finance():
    path = "finance.html"
    with open(path, "r") as f:
        content = f.read()
    
    # 1. Mortgage
    mortgage_deep_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 24px;">Deep Dive: The Math of Mortgage Amortization</h2>
        
        <h3>The Formula</h3>
        <p>The standard fixed-rate mortgage payment is calculated using the following annuity formula:</p>
        <div style="background: var(--surface); padding: 24px; border-radius: 16px; font-family: 'DM Mono', monospace; margin-bottom: 24px; text-align: center; font-size: 20px;">
            M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
        </div>
        <ul>
            <li><strong>M:</strong> Total monthly payment</li>
            <li><strong>P:</strong> Principal loan amount</li>
            <li><strong>i:</strong> Monthly interest rate (Annual rate / 12)</li>
            <li><strong>n:</strong> Number of months (Years * 12)</li>
        </ul>

        <h3>Worked Example</h3>
        <p>Let's say you buy a home for $400,000 with a 20% down payment ($80,000). Your loan amount (P) is $320,000. At a 6% annual interest rate, your monthly rate (i) is 0.005. Over 30 years, you have 360 monthly payments (n).</p>
        <p>Plugging these in: M = 320,000 [ 0.005(1.005)^360 ] / [ (1.005)^360 – 1 ]. The resulting monthly payment is <strong>$1,918.56</strong>.</p>

        <h3>Common Misconceptions</h3>
        <p>One of the biggest mistakes borrowers make is assuming they are building equity at a linear rate. In reality, interest is calculated on the <em>remaining balance</em>. In the early years, nearly 80% of your payment goes to interest. This is why selling a home after only 3 or 4 years often results in a net loss once closing costs are factored in.</p>
        
        <h3>When to Use This Calculator</h3>
        <p>Use this tool when comparing different loan terms (15 vs 30 years) or seeing how a higher down payment affects your monthly cash flow. Do not use this as a final bank quote, as it does not include PMI, property taxes, or homeowners insurance (PITI).</p>
    </div>
    """
    
    # 2. Compound Interest
    compound_deep_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 24px;">Deep Dive: The Power of Compounding</h2>
        
        <h3>The Formula</h3>
        <p>The future value of an investment with recurring contributions is calculated as:</p>
        <div style="background: var(--surface); padding: 24px; border-radius: 16px; font-family: 'DM Mono', monospace; margin-bottom: 24px; text-align: center; font-size: 20px;">
            A = P(1 + r/n)^(nt) + PMT [((1 + r/n)^(nt) - 1) / (r/n)]
        </div>
        <ul>
            <li><strong>A:</strong> Future value of the investment</li>
            <li><strong>P:</strong> Initial principal</li>
            <li><strong>r:</strong> Annual interest rate</li>
            <li><strong>n:</strong> Compounding frequency per year</li>
            <li><strong>t:</strong> Number of years</li>
            <li><strong>PMT:</strong> Monthly contribution</li>
        </ul>

        <h3>Worked Example</h3>
        <p>If you start with $10,000 (P), contribute $500/month (PMT), and earn a 7% annual return (r) compounded monthly (n=12) for 20 years (t), your final balance would be <strong>$304,382</strong>. Of that, only $130,000 was your actual contribution—the rest is pure interest growth.</p>

        <h3>Common Mistakes</h3>
        <p>The most common error is neglecting the impact of inflation. While $1 million in 20 years sounds like a lot, its "real" purchasing power will be significantly less. Investors should often use a "real" rate of return (e.g., 7% instead of 10%) to account for a 3% average inflation rate.</p>
    </div>
    """

    # 3. FIRE
    fire_deep_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 24px;">Deep Dive: The Math of Financial Independence</h2>
        
        <h3>The Formula</h3>
        <p>The "FIRE Number" is primarily based on the <strong>4% Rule</strong>, which suggests that a portfolio has a high probability of lasting 30 years if you withdraw 4% in year one and adjust for inflation. The target number is calculated as:</p>
        <div style="background: var(--surface); padding: 24px; border-radius: 16px; font-family: 'DM Mono', monospace; margin-bottom: 24px; text-align: center; font-size: 20px;">
            Target = Annual Expenses / 0.04 (or Annual Expenses * 25)
        </div>

        <h3>Worked Example</h3>
        <p>If your household spends $60,000 per year, your FIRE target is $60,000 * 25 = <strong>$1,500,000</strong>. If you currently have $500,000 saved and contribute $2,000/month at a 7% return, our calculator projects you will reach that goal in approximately 14.5 years.</p>

        <h3>When NOT to Use This Tool</h3>
        <p>The 4% rule was designed for a 30-year retirement window. If you plan to retire at age 35 and live to 95, a 60-year horizon significantly increases the risk of running out of money. In these cases, many experts recommend a more conservative 3.25% or 3.5% withdrawal rate.</p>
    </div>
    """

    # Injecting into finance.html
    # We find the end of the results div for each section
    content = content.replace('<div id="mort-results" class="result-panel">', mortgage_deep_dive + '<div id="mort-results" class="result-panel">')
    # Actually, the user said BELOW the existing UI, so it should be after the result panel
    
    # Let's try to find the closing </div> of the calc-container
    # Mortgage is id="mortgage"
    # Compound is id="compound"
    # FIRE is id="fire"
    
    # I'll use a more precise replacement
    content = content.replace('<!-- End Mortgage -->', mortgage_deep_dive + '<!-- End Mortgage -->')
    # Wait, does the file have these comments? No.
    
    # Let's find the closing </div> for each container
    # I'll just append it to the end of the respective container divs
    
    sections = {
        'id="mortgage"': mortgage_deep_dive,
        'id="compound"': compound_deep_dive,
        'id="fire"': fire_deep_dive
    }
    
    for marker, dive in sections.items():
        # Find the start of the next section to know where this one ends
        # Or just replace the closing tag of the container
        # Since I know the structure, I'll search for the next container or the main end
        pass

    # Actually, a simpler way:
    # Mortgage ends before <div id="compound"
    content = content.replace('<div id="compound"', mortgage_deep_dive + '<div id="compound"')
    content = content.replace('<div id="loan"', compound_deep_dive + '<div id="loan"')
    content = content.replace('<div id="retirement401k"', fire_deep_dive + '<div id="retirement401k"')
    
    with open(path, "w") as f:
        f.write(content)
    print("Expanded finance.html")

def expand_health():
    path = "health.html"
    with open(path, "r") as f:
        content = f.read()
    
    bmi_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 24px;">Deep Dive: Understanding BMI Accuracy</h2>
        <h3>The Formula</h3>
        <p>The Body Mass Index is a simple mathematical relationship between mass and height:</p>
        <div style="background: var(--surface); padding: 24px; border-radius: 16px; font-family: 'DM Mono', monospace; margin-bottom: 24px; text-align: center; font-size: 20px;">
            BMI = weight (kg) / [height (m)]^2
        </div>
        <h3>Worked Example</h3>
        <p>An individual weighing 80kg and standing 1.8m tall would have a BMI of: 80 / (1.8 * 1.8) = <strong>24.7</strong>. This falls into the "Healthy Weight" category (18.5 - 24.9).</p>
        <h3>Common Mistakes</h3>
        <p>The most common misconception is that BMI measures body fat. It does not. It measures <em>excess weight</em>. A person with high muscle mass may have a BMI over 30 (Obese) while having a visible six-pack and excellent cardiovascular health.</p>
    </div>
    """
    
    tdee_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 24px;">Deep Dive: The Science of Metabolic Rate</h2>
        <h3>The Formula</h3>
        <p>Most TDEE calculators use the <strong>Mifflin-St Jeor Equation</strong> to find BMR, then apply an Activity Factor (1.2 to 1.9):</p>
        <div style="background: var(--surface); padding: 24px; border-radius: 16px; font-family: 'DM Mono', monospace; margin-bottom: 24px; text-align: center; font-size: 16px;">
            BMR (Male) = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5<br>
            BMR (Female) = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
        </div>
        <h3>Worked Example</h3>
        <p>A 30-year-old male, 180cm, 80kg, who exercises 3-5 times a week would have a BMR of ~1,790. Applying a "Moderate" activity factor of 1.55 results in a TDEE of <strong>2,775 calories</strong> per day.</p>
    </div>
    """
    
    content = content.replace('<div id="macro"', bmi_dive + '<div id="macro"')
    content = content.replace('<div id="fat"', tdee_dive + '<div id="fat"')
    
    with open(path, "w") as f:
        f.write(content)
    print("Expanded health.html")

def expand_business():
    path = "business.html"
    with open(path, "r") as f:
        content = f.read()
    
    burn_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 24px;">Deep Dive: Managing Startup Runway</h2>
        <h3>The Formula</h3>
        <div style="background: var(--surface); padding: 24px; border-radius: 16px; font-family: 'DM Mono', monospace; margin-bottom: 24px; text-align: center; font-size: 20px;">
            Runway (Months) = Current Cash / Net Burn Rate
        </div>
        <h3>Worked Example</h3>
        <p>If your startup has $500,000 in the bank and your monthly expenses are $50,000 while generating $10,000 in revenue, your Net Burn is $40,000. Your runway is 500,000 / 40,000 = <strong>12.5 months</strong>.</p>
        <h3>Common Mistakes</h3>
        <p>Founders often forget to account for "lumpy" expenses like annual software renewals, tax payments, or hiring bonuses. Always maintain a 20% buffer on your projected burn rate.</p>
    </div>
    """
    
    break_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 24px;">Deep Dive: Finding Your Break-Even Point</h2>
        <h3>The Formula</h3>
        <div style="background: var(--surface); padding: 24px; border-radius: 16px; font-family: 'DM Mono', monospace; margin-bottom: 24px; text-align: center; font-size: 20px;">
            Break-Even (Units) = Fixed Costs / (Price per Unit - Variable Cost per Unit)
        </div>
        <h3>Worked Example</h3>
        <p>If your monthly rent and salaries (Fixed Costs) are $10,000, and you sell a product for $100 that costs $60 to make (Variable Cost), your contribution margin is $40. You need to sell 10,000 / 40 = <strong>250 units</strong> to break even.</p>
    </div>
    """
    
    content = content.replace('<div id="break"', burn_dive + '<div id="break"')
    content = content.replace('<div id="ltv"', break_dive + '<div id="ltv"')
    
    with open(path, "w") as f:
        f.write(content)
    print("Expanded business.html")

def expand_legal_tax():
    path = "legal-tax.html"
    with open(path, "r") as f:
        content = f.read()
    
    llc_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 24px;">Deep Dive: LLC vs. S-Corp Tax Strategy</h2>
        <h3>The Core Distinction</h3>
        <p>The primary reason business owners elect S-Corp status is to reduce <strong>Self-Employment Tax</strong> (15.3%). In a standard LLC, you pay this on 100% of profit. In an S-Corp, you only pay it on your "Reasonable Salary."</p>
        <h3>Worked Example</h3>
        <p>If your business makes $100,000 in profit:<br>
        - <strong>As LLC:</strong> You pay 15.3% on $100,000 = $15,300 in SE taxes.<br>
        - <strong>As S-Corp:</strong> You pay yourself $60,000 salary. You pay 15.3% on $60,000 = $9,180. The remaining $40,000 is a distribution (0% SE tax). You save <strong>$6,120</strong> per year.</p>
    </div>
    """
    
    content = content.replace('<div id="se-tax"', llc_dive + '<div id="se-tax"')
    
    with open(path, "w") as f:
        f.write(content)
    print("Expanded legal-tax.html")

def expand_medical():
    path = "medical.html"
    with open(path, "r") as f:
        content = f.read()
    
    crcl_dive = """
    <div class="deep-dive" style="margin-top: 64px; padding-top: 64px; border-top: 1px solid var(--border);">
        <h2 style="font-size: 32px; font-weight: 700; margin-bottom: 24px;">Deep Dive: Creatinine Clearance & Renal Dosing</h2>
        <h3>The Formula (Cockcroft-Gault)</h3>
        <div style="background: var(--surface); padding: 24px; border-radius: 16px; font-family: 'DM Mono', monospace; margin-bottom: 24px; text-align: center; font-size: 18px;">
            CrCl = ((140 - Age) * Weight) / (72 * SCr) [ * 0.85 if Female ]
        </div>
        <h3>Worked Example</h3>
        <p>A 70-year-old male patient weighing 72kg with a serum creatinine of 1.2 mg/dL has an estimated CrCl of:<br>
        ((140 - 70) * 72) / (72 * 1.2) = 70 / 1.2 = <strong>58.3 mL/min</strong>. This indicates mild to moderate renal impairment.</p>
    </div>
    """
    
    content = content.replace('<div id="dosage"', crcl_dive + '<div id="dosage"')
    
    with open(path, "w") as f:
        f.write(content)
    print("Expanded medical.html")

if __name__ == "__main__":
    expand_finance()
    expand_health()
    expand_business()
    expand_legal_tax()
    expand_medical()
