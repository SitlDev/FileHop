import os
import re

INFO_BLOCK_CSS = """
        .info-block { display: none; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 40px; margin-top: 32px; animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .info-block.active { display: block; }
        .info-block h2 { font-size: 24px; margin-bottom: 16px; }
"""

SHOW_TAB_JS = """
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
            // Reset results on tab switch
            document.querySelectorAll('.result-panel').forEach(p => p.classList.remove('visible'));
        }
"""

PAGE_INFO = {
    'ai-costs.html': {
        'ai': '<h2>LLM Token <span style="color: var(--accent);">Economics</span></h2><p style="color: var(--muted); line-height: 1.8;">Token-based pricing is the standard for modern LLMs. A "token" is approximately 0.75 words. Understanding your Input vs Output ratio is critical for high-volume applications, as output tokens are typically priced 2x-3x higher than input tokens.</p>',
        'tokens': '<h2>Context Window & <span style="color: var(--accent2);">Density</span></h2><p style="color: var(--muted); line-height: 1.8;">Context windows define how much information an AI can "remember" at once. Operating at the edge of a context window can lead to "retrieval degradation." Use this tool to estimate the real-world word count that fits within specific model limits.</p>',
        'storage': '<h2>Vector Database <span style="color: var(--accent);">Scaling</span></h2><p style="color: var(--muted); line-height: 1.8;">Vector embeddings (like those used in RAG) require specific storage considerations. Dimension size (e.g., 1536 for OpenAI) and index type (HNSW vs Flat) significantly impact both memory overhead and retrieval latency.</p>',
        'ft': '<h2>Fine-Tuning <span style="color: var(--accent2);">ROI</span></h2><p style="color: var(--muted); line-height: 1.8;">Fine-tuning is often used to impart specific style or formatting and can reduce token costs by removing the need for long few-shot prompts. However, the hourly training cost and higher inference premiums must be justified by volume.</p>',
        'gpu': '<h2>GPU Infrastructure <span style="color: var(--accent);">Math</span></h2><p style="color: var(--muted); line-height: 1.8;">When deciding between Cloud vs On-Prem, account for the Duty Cycle (how often the GPU is active). If your average utilization is over 40%, multi-year reserved instances or local hardware typically offer substantial savings over on-demand pricing.</p>'
    },
    'audio.html': {
        'delay': '<h2>BPM & Time <span style="color: var(--accent);">Synchronization</span></h2><p style="color: var(--muted); line-height: 1.8;">Synchronizing delay times and reverb decays to the project BPM ensures rhythmic clarity. To calculate a quarter note in milliseconds, divide 60,000 by the BPM. This eliminates "rhythmic mud" and tightens the overall professional sound of a mix.</p>',
        'room': '<h2>Acoustic Room <span style="color: var(--accent2);">Modes</span></h2><p style="color: var(--muted); line-height: 1.8;">Standing waves (modes) occur when sound waves reflect between parallel walls, creating peaks and nulls in frequency response. The primary axial modes are the most problematic. Knowing these frequencies allows you to apply targeted acoustic treatment or EQ correction.</p>',
        'freq': '<h2>Frequency to <span style="color: var(--accent);">Note Mapping</span></h2><p style="color: var(--muted); line-height: 1.8;">Western music is typically tuned to A=440Hz. Frequencies follow a logarithmic scale where each octave is a doubling of frequency. This tool allows you to map specific resonant frequencies to musical keys, essential for tuning kick drums or removing harsh "ringing" resonances.</p>',
        'storage': '<h2>Audio Data <span style="color: var(--accent2);">Forecasting</span></h2><p style="color: var(--muted); line-height: 1.8;">Uncompressed audio (WAV/AIFF) requires significant bandwidth. A standard 2-channel, 24-bit, 48kHz file requires approximately 17.28 MB per minute. Proper file size estimation is critical for session management and cloud archival planning.</p>'
    },
    'engineering.html': {
        'acdc': '<h2>Power & <span style="color: var(--accent);">Ohm\'s Law</span></h2><p style="color: var(--muted); line-height: 1.8;">Ohm\'s Law states that V = I R. In AC circuits, we must also account for Power Factor (PF), which represents the phase difference between voltage and current. High efficiency systems aim for a PF close to 1.0 (Unity).</p>',
        'three-phase': '<h2>3-Phase <span style="color: var(--accent2);">Load Balancing</span></h2><p style="color: var(--muted); line-height: 1.8;">3-Phase power provides more constant power flow and higher efficiency for industrial motors. Total power is calculated as P = V * I * 1.732 * PF. Balanced phases prevent overheating and extend the lifespan of heavy machinery.</p>',
        'vdrop': '<h2>Voltage Drop <span style="color: var(--accent);">Mitigation</span></h2><p style="color: var(--muted); line-height: 1.8;">Voltage drop occurs due to the resistance of the conductor over distance. NEC (National Electrical Code) typically recommends a maximum drop of 3% for branch circuits. Increasing wire gauge (lower AWG) is the primary method to combat excessive drop.</p>',
        'drift': '<h2>Component <span style="color: var(--accent2);">Tolerance</span></h2><p style="color: var(--muted); line-height: 1.8;">All passive components (Resistors, Capacitors) have a tolerance (e.g., +/- 1%, 5%). Over time and temperature changes, components "drift." Precision circuits must account for these variations to maintain stability in signal processing and timing.</p>'
    },
    'marketing.html': {
        'roas': '<h2>ROAS vs <span style="color: var(--accent);">ROI</span></h2><p style="color: var(--muted); line-height: 1.8;">Return on Ad Spend (ROAS) focuses purely on revenue generated per dollar spent on ads. ROI (Return on Investment) is more holistic, accounting for Cost of Goods Sold (COGS), shipping, and labor. A high ROAS can still result in a negative ROI if margins are thin.</p>',
        'cpc': '<h2>CPC to <span style="color: var(--accent2);">CPA Flow</span></h2><p style="color: var(--muted); line-height: 1.8;">Converting clicks (CPC) to acquisitions (CPA) depends entirely on your Conversion Rate. If your CPC is $2.00 and your conversion rate is 2%, your CPA is $100. Improving on-page conversion is often more cost-effective than lowering your bid price.</p>',
        'conv': '<h2>Conversion <span style="color: var(--accent);">Optimization</span></h2><p style="color: var(--muted); line-height: 1.8;">The conversion rate reflects the percentage of visitors who take a desired action (purchase, lead, signup). Small improvements in CR have a compound effect on profitability. A jump from 1% to 2% effectively doubles your revenue for the same ad spend.</p>',
        'email': '<h2>Email List <span style="color: var(--accent2);">Valuation</span></h2><p style="color: var(--muted); line-height: 1.8;">Owned media (email lists) typically offers the highest ROI in marketing. Value is determined by Open Rates, Click-Through Rates (CTR), and Purchase Frequency. Segmenting your list allows for higher personalization and significantly higher Revenue Per Subscriber (RPS).</p>'
    },
    'green.html': {
        'solar': '<h2>Solar <span style="color: var(--accent);">Payback Period</span></h2><p style="color: var(--muted); line-height: 1.8;">The payback period is the time it takes for your energy savings to cover the initial installation cost. This accounts for tax credits (ITC), local incentives, and net metering rates. Standard residential systems typically see an ROI within 6-9 years.</p>',
        'carbon': '<h2>Carbon <span style="color: var(--accent2);">Footprint Math</span></h2><p style="color: var(--muted); line-height: 1.8;">Carbon footprinting measures the total greenhouse gas emissions (in CO2e) caused by an individual or event. Reducing travel and switching to renewable energy sources are the most impactful levers for lowering your personal environmental impact.</p>',
        'appl': '<h2>Appliance <span style="color: var(--accent);">Energy Audits</span></h2><p style="color: var(--muted); line-height: 1.8;">Phantom power (standby power) can account for up to 10% of a home energy bill. Understanding the Wattage requirements of your appliances allows you to identify "vampire" devices and prioritize the replacement of old, inefficient hardware with Energy Star rated alternatives.</p>',
        'water': '<h2>Water <span style="color: var(--accent2);">Conservation</span></h2><p style="color: var(--muted); line-height: 1.8;">Water scarcity is a growing global challenge. Simple retrofits like low-flow showerheads and dual-flush toilets can reduce household water consumption by 30-50%. Monitoring per-capita usage helps in identifying leaks and optimizing irrigation schedules.</p>'
    },
    'science.html': {
        'molarity': '<h2>Molarity & <span style="color: var(--accent);">Concentration</span></h2><p style="color: var(--muted); line-height: 1.8;">Molarity (M) is the number of moles of solute per liter of solution. It is the most common way to express concentration in chemistry. Precision in molar calculations is essential for everything from pharmaceutical compounding to industrial chemical synthesis.</p>',
        'dilution': '<h2>C1V1 <span style="color: var(--accent2);">Dilution Logic</span></h2><p style="color: var(--muted); line-height: 1.8;">The dilution law (C1V1 = C2V2) states that the amount of solute remains constant as you add solvent. This is a fundamental skill in laboratory work, ensuring that working solutions are prepared correctly from stock concentrations.</p>',
        'gas': '<h2>Ideal Gas <span style="color: var(--accent);">Laws</span></h2><p style="color: var(--muted); line-height: 1.8;">The Ideal Gas Law (PV = nRT) describes the behavior of a theoretical gas. While real gases deviate at extreme high pressures or low temperatures, these calculations provide highly accurate predictions for most atmospheric and industrial conditions.</p>',
        'mass': '<h2>Molecular <span style="color: var(--accent2);">Weight Math</span></h2><p style="color: var(--muted); line-height: 1.8;">Molecular weight (Molar Mass) is the sum of the atomic weights of all atoms in a molecule. This value is used to convert between mass (grams) and moles, allowing scientists to perform stoichiometric calculations for chemical reactions.</p>'
    },
    'academic.html': {
        'curve': '<h2>Grade <span style="color: var(--accent);">Curving Logic</span></h2><p style="color: var(--muted); line-height: 1.8;">Grade curves (like the Flat Addition or Square Root curve) are used to adjust scores to follow a desired distribution. This ensures that a particularly difficult exam doesn\'t unfairly penalize high-performing students while maintaining a relative performance hierarchy.</p>',
        'hindex': '<h2>h-index <span style="color: var(--accent2);">Projections</span></h2><p style="color: var(--muted); line-height: 1.8;">The h-index measures both the productivity and citation impact of a researcher. An h-index of 20 means a researcher has 20 papers with at least 20 citations each. It is the gold standard for institutional hiring and grant awarding in academia.</p>'
    }
}

def update_page(filename):
    filepath = os.path.join('/Users/amn/Documents/GitHub/Claude/CalculatorPages', filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename} - Not found")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update/Inject CSS
    if '.info-block {' not in content:
        content = re.sub(r'(</style>)', INFO_BLOCK_CSS + r'\1', content)

    # 2. Update showTab function (be careful about the existing one)
    # First remove any existing showTab
    content = re.sub(r'function showTab\(id, event\)\s*{[^}]*}', '', content) # Match existing format
    content = re.sub(r'function showTab\(id, e\)\s*{[^}]*}', '', content)
    
    # Check if we have a script tag to inject into
    if '<script>' in content:
        # Inject after the first script tag start
        content = re.sub(r'(<script>)', r'\1' + SHOW_TAB_JS, content)
    else:
        # Create a script tag
        content = content.replace('</body>', f'<script>{SHOW_TAB_JS}</script>\n</body>')

    # 3. Inject Info Blocks Section
    if '<section class="seo-section"' not in content:
        info_html = '\n            <section class="seo-section" style="margin-top: 64px;">\n'
        for i, (tab_id, tab_info) in enumerate(PAGE_INFO[filename].items()):
            active_class = ' active' if i == 0 else ''
            info_html += f'                <div id="info-{tab_id}" class="info-block{active_class}">\n                    {tab_info}\n                </div>\n'
        info_html += '            </section>\n'
        
        # Inject before feedback section or before end of container
        if '<section class="feedback-section"' in content:
            content = re.sub(r'(<section class="feedback-section")', info_html + r'\1', content)
        else:
            # Better injection point: before the last </div> before </main>
            content = re.sub(r'(</div>\s*</main>)', info_html + r'\1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for page in PAGE_INFO.keys():
    update_page(page)
    print(f"Updated {page}")
