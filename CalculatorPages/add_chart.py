import re

with open('savings.html', 'r') as f:
    text = f.read()

# 1. Add Chart.js to head
if 'chart.js' not in text:
    text = text.replace('</head>', '    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n</head>')

# 2. Add canvas to Emergency Fund results
target_html = """                <div id="emerg-results" class="result-panel">
                    <div class="result-grid">
                        <div class="result-item"><span class="result-label">Target Fund Size</span><span class="result-value" id="em-out">$0</span></div>
                        <div class="result-item"><span class="result-label">Months to Reach Target</span><span class="result-value" id="em-mo" style="color:var(--accent2)">0</span></div>
                    </div>"""
new_html = """                <div id="emerg-results" class="result-panel">
                    <div class="result-grid">
                        <div class="result-item"><span class="result-label">Target Fund Size</span><span class="result-value" id="em-out">$0</span></div>
                        <div class="result-item"><span class="result-label">Months to Reach Target</span><span class="result-value" id="em-mo" style="color:var(--accent2)">0</span></div>
                    </div>
                    <div class="chart-container" style="position: relative; height:40px; width:100%; border-radius:8px; overflow:hidden; background: rgba(255,255,255,0.05); margin-top:20px; display:flex;">
                        <div id="em-bar-progress" style="height:100%; width:0%; background:var(--accent); transition: width 1s cubic-bezier(0.4,0,0.2,1); display:flex; align-items:center; justify-content:flex-end; padding-right:12px; color:#000; font-weight:800; font-size:12px;"></div>
                        <div id="em-bar-remaining" style="height:100%; width:100%; display:flex; align-items:center; padding-left:12px; color:var(--muted); font-weight:600; font-size:12px;"></div>
                    </div>"""
text = text.replace(target_html, new_html)

# 3. Update the calculateEmergency logic
target_js = """                document.getElementById('em-out').innerText = formatter.format(target);
                document.getElementById('em-mo').innerText = Math.ceil(target / save);
                document.getElementById('emerg-results').classList.add('visible');"""

new_js = """                document.getElementById('em-out').innerText = formatter.format(target);
                document.getElementById('em-mo').innerText = Math.ceil(target / save);
                
                // Native visual bar
                const currentPct = Math.min(100, (curr / target) * 100);
                setTimeout(() => {
                    document.getElementById('em-bar-progress').style.width = currentPct + '%';
                    document.getElementById('em-bar-progress').innerText = currentPct > 10 ? currentPct.toFixed(0) + '%' : '';
                    document.getElementById('em-bar-remaining').innerText = (100 - currentPct).toFixed(0) + '% Remaining';
                }, 100);

                document.getElementById('emerg-results').classList.add('visible');"""
text = text.replace(target_js, new_js)

with open('savings.html', 'w') as f:
    f.write(text)

