import os
import re

INFO_BLOCK_CSS = """
        .info-block { display: none; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 40px; margin-top: 32px; animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .info-block.active { display: block; }
        .info-block h2 { font-size: 24px; margin-bottom: 16px; }
"""

SHOW_TAB_JS = """
function showTab(id, e) {
    document.querySelectorAll('.calc-container').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.info-block').forEach(i => i.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    if (e) e.target.classList.add('active');
    
    const info = document.getElementById('info-' + id);
    if (info) info.classList.add('active');
}
"""

PAGE_INFO = {
    'health.html': {
        'bmi': '<h2>BMI <span style="color: var(--accent);">Classification</span></h2><p style="color: var(--muted); line-height: 1.8;">Body Mass Index (BMI) is a screening tool used to categorize individuals into weight groups. While it does not measure body fat directly, it is highly correlated with more direct measures of body fatness. <b>BMIs under 18.5</b> are underweight, <b>18.5-24.9</b> are healthy, and <b>25-29.9</b> are overweight.</p>',
        'tdee': '<h2>TDEE & <span style="color: var(--accent2);">Metabolism</span></h2><p style="color: var(--muted); line-height: 1.8;">Total Daily Energy Expenditure (TDEE) represents the total number of calories your body burns in a 24-hour period. It combines your Basal Metabolic Rate (BMR) with your physical activity level. Understanding your TDEE is the starting point for any weight loss or muscle gain objective.</p>',
        'macros': '<h2>Macronutrient <span style="color: var(--accent);">Splits</span></h2><p style="color: var(--muted); line-height: 1.8;">Macronutrients—Protein, Carbohydrates, and Fats—are the building blocks of nutrition. A common 40/30/30 split is often used for weight management, but high-protein diets are essential for muscle preservation during a calorie deficit.</p>',
        'water': '<h2>Hydration <span style="color: var(--accent2);">Targets</span></h2><p style="color: var(--muted); line-height: 1.8;">Optimal hydration is critical for cognitive function and physical performance. This calculation accounts for your body weight and provides a baseline target. Note that intense exercise or heat can increase these requirements by 500ml-1L per hour of activity.</p>',
        'hrz': '<h2>Heart Rate <span style="color: var(--accent);">Zones</span></h2><p style="color: var(--muted); line-height: 1.8;">Training within specific heart rate zones allows you to target different energy systems. Zone 2 (60-70% of Max HR) is ideal for aerobic base building and fat oxidation, while Zone 4/5 (85%+) targets VO2 max and anaerobic capacity.</p>'
    },
    'invest.html': {
        'p-l': '<h2>Crypto <span style="color: var(--accent);">Profit & Loss</span></h2><p style="color: var(--muted); line-height: 1.8;">Calculate your net gains after accounting for purchase price, sell price, and quantity. Remember that capital gains taxes apply differently based on your holding period (Short-term vs Long-term capital gains).</p>',
        'options': '<h2>Stock Option <span style="color: var(--accent2);">Value</span></h2><p style="color: var(--muted); line-height: 1.8;">Stock options give you the right to buy shares at a set strike price. The value (intrinsic) is the difference between the current market price and your strike price. Don\'t forget to account for vesting schedules and expiration dates.</p>',
        'dca': '<h2>Dollar Cost <span style="color: var(--accent);">Averaging (DCA)</span></h2><p style="color: var(--muted); line-height: 1.8;">DCA is a strategy where you invest a fixed amount regardless of asset price. This reduces the impact of volatility and removes the need to "time the market." Over long periods, DCA often outperforms emotional attempts to buy at bottoms.</p>',
        'rebalance': '<h2>Portfolio <span style="color: var(--accent2);">Rebalancing</span></h2><p style="color: var(--muted); line-height: 1.8;">As assets fluctuate, your desired allocation drifts. Rebalancing involves selling high-performing assets to buy underperforming ones, effectively "selling high and buying low" while maintaining your target risk profile.</p>'
    },
    'business.html': {
        'runway': '<h2>Startup <span style="color: var(--accent);">Cash Runway</span></h2><p style="color: var(--muted); line-height: 1.8;">Runway is the number of months a company can operate before it runs out of cash. It is calculated by dividing your Current Cash by your Net Burn (Expenses minus Revenue). Extending runway is the primary objective of early-stage survival management.</p>',
        'breakeven': '<h2>Break-Even <span style="color: var(--accent2);">Analysis</span></h2><p style="color: var(--muted); line-height: 1.8;">The break-even point is the level at which total revenue equals total costs. Beyond this point, every additional sale generates profit. Understanding your break-even volume helps in setting pricing and sales targets for sustainability.</p>',
        'ltv': '<h2>CAC / LTV <span style="color: var(--accent);">Ratio</span></h2><p style="color: var(--muted); line-height: 1.8;">The relationship between Customer Acquisition Cost (CAC) and Lifetime Value (LTV) is the ultimate measure of unit economics. A healthy ratio is typically 3:1 or higher. If CAC exceeds LTV, your business model loses money with every new customer.</p>',
        'margin': '<h2>Profit Margin <span style="color: var(--accent2);">Logic</span></h2><p style="color: var(--muted); line-height: 1.8;">Net margin is the percentage of revenue remaining after all operating expenses, taxes, and costs are paid. Higher margins provide a buffer against market fluctuations and allow for faster reinvestment into growth and innovation.</p>'
    },
    'real-estate.html': {
        'rentbuy': '<h2>Rent vs <span style="color: var(--accent);">Buy Math</span></h2><p style="color: var(--muted); line-height: 1.8;">Deciding between renting and buying involves more than just comparing a monthly mortgage to monthly rent. You must account for opportunity costs, property taxes, maintenance (usually 1% of home value/year), and historical appreciation rates.</p>',
        'afford': '<h2>Home <span style="color: var(--accent2);">Affordability</span></h2><p style="color: var(--muted); line-height: 1.8;">Lenders typically suggest that your monthly debt payments (including mortgage, insurance, and taxes) should not exceed 28-36% of your gross monthly income. This "debt-to-income" (DTI) ratio is the primary barrier to most home purchases.</p>',
        'roi': '<h2>Rental Property <span style="color: var(--accent);">Cap Rate</span></h2><p style="color: var(--muted); line-height: 1.8;">Capitalization Rate (Cap Rate) is used to estimate the investor\'s potential return on a real estate investment. It is the Net Operating Income divided by the Current Market Value. Higher cap rates indicate higher potential returns but often higher risk.</p>',
        'closing': '<h2>Closing Cost <span style="color: var(--accent2);">Estimation</span></h2><p style="color: var(--muted); line-height: 1.8;">Closing costs typically range from 2% to 5% of the purchase price. These include origination fees, title insurance, appraisal fees, and government recording taxes. Failing to budget for these can derail a transaction at the final stage.</p>'
    }
}

def update_page(filename):
    filepath = os.path.join('/Users/amn/Documents/GitHub/Claude/CalculatorPages', filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update CSS
    if '.info-block {' not in content:
        content = re.sub(r'(</style>)', INFO_BLOCK_CSS + r'\1', content)

    # 2. Update showTab function
    content = re.sub(r'function showTab\(id, e\)\s*{[^}]*}', SHOW_TAB_JS, content)

    # 3. Inject Info Blocks Section
    if '<section class="seo-section"' not in content:
        info_html = '\n            <section class="seo-section" style="margin-top: 64px;">\n'
        for tab_id, tab_info in PAGE_INFO[filename].items():
            active_class = ' active' if tab_id in ['bmi', 'p-l', 'runway', 'rentbuy'] else ''
            info_html += f'                <div id="info-{tab_id}" class="info-block{active_class}">\n                    {tab_info}\n                </div>\n'
        info_html += '            </section>\n'
        
        # Inject before feedback section or before end of container
        if '<section class="feedback-section"' in content:
            content = re.sub(r'(<section class="feedback-section")', info_html + r'\1', content)
        else:
            content = re.sub(r'(</div>\s*</main>)', info_html + r'\1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for page in PAGE_INFO.keys():
    update_page(page)
    print(f"Updated {page}")
