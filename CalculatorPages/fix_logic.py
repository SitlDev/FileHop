#!/usr/bin/env python3
"""
Comprehensive fix script — all confirmed real logic bugs and missing UX context
across all 32 YourCalc calculator pages.
"""
import re, os

BASE = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'

def read(fn):
    with open(os.path.join(BASE, fn)) as f:
        return f.read()

def write(fn, c):
    with open(os.path.join(BASE, fn), 'w') as f:
        f.write(c)

def patch(fn, old, new, label):
    c = read(fn)
    if old in c:
        write(fn, c.replace(old, new, 1))
        print(f"  ✅  {fn}: {label}")
        return True
    print(f"  ❌  {fn}: PATTERN NOT FOUND — {label}")
    return False

def patch_re(fn, pattern, replacement, label, flags=re.DOTALL):
    c = read(fn)
    new_c, n = re.subn(pattern, replacement, c, count=1, flags=flags)
    if n:
        write(fn, new_c)
        print(f"  ✅  {fn}: {label} ({n})")
        return True
    print(f"  ❌  {fn}: REGEX NOT MATCHED — {label}")
    return False

print("=" * 60)
print("FIX 1: pets.html — toxicity % not divided by 100")
print("=" * 60)
patch('pets.html',
    'const mgPerKg = (a * t) / (w / 2.2);',
    'const mgPerKg = (a * (t / 100)) / (w / 2.2);  // t is % so divide by 100',
    "toxicity formula: t/100")

print()
print("=" * 60)
print("FIX 2: science.html — gas law needs Kelvin label on temperature")
print("=" * 60)
patch('science.html',
    '<label>Temperature (T)</label>',
    '<label>Temperature (Kelvin) <span style="font-size:10px; font-weight:400; color:var(--muted);">e.g. 298 for 25°C. K = °C + 273</span></label>',
    "temperature Kelvin hint")

print()
print("=" * 60)
print("FIX 3: audio.html — room mode calc assumes feet, no label")
print("=" * 60)
patch('audio.html',
    '<label>Length</label>',
    '<label>Length <span style="font-size:10px; font-weight:400; color:var(--muted);">(feet)</span></label>',
    "room length label ft")
patch('audio.html',
    '<label>Width</label>',
    '<label>Width <span style="font-size:10px; font-weight:400; color:var(--muted);">(feet)</span></label>',
    "room width label ft")
patch('audio.html',
    '<label>Height</label>',
    '<label>Height <span style="font-size:10px; font-weight:400; color:var(--muted);">(feet)</span></label>',
    "room height label ft")

print()
print("=" * 60)
print("FIX 4: auto.html — EV efficiency hardcoded at 3 mi/kWh, no input")
print("=" * 60)
# Add EV efficiency input after the kWh price group
c = read('auto.html')
old_ev_input = '''                    <div class="input-group" style="grid-column: 1 / -1;"><label title="EVs require ~50% less maintenance (oil changes, etc).">Include Maint. Savings? ⓘ</label>'''
new_ev_input = '''                    <div class="input-group"><label>EV Efficiency (mi/kWh) <span style="font-size:10px; font-weight:400; color:var(--muted);">Tesla ~4, avg EV ~3, truck ~2.3</span></label>
                        <div class="input-wrapper"><input type="number" id="ev-eff" value="3.0" step="0.1" min="1" max="7"></div>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;"><label title="EVs require ~50% less maintenance (oil changes, etc).">Include Maint. Savings? ⓘ</label>'''
if old_ev_input in c:
    write('auto.html', c.replace(old_ev_input, new_ev_input, 1))
    print("  ✅  auto.html: added EV efficiency input")
else:
    print("  ❌  auto.html: EV efficiency input anchor not found")

# Fix the calculateEV function to use the new input
patch('auto.html',
    'const evCost = (dist / 3.0) * kwp;',
    'const evEff = parseFloat(document.getElementById(\'ev-eff\').value) || 3.0;\n                const evCost = (dist / evEff) * kwp;',
    "EV efficiency uses input instead of hardcoded 3.0")

print()
print("=" * 60)
print("FIX 5: auto.html — lease vs buy ignores financing cost")
print("=" * 60)
# Add a note to the result
patch('auto.html',
    '<span class="result-label">Cost to Own</span><span class="result-value" id="lb-own">$0</span>',
    '<span class="result-label">Cost to Own (Cash)</span><span class="result-value" id="lb-own">$0</span>',
    "lease/buy labels cash assumption")
patch('auto.html',
    '<label>Residual Value</label>',
    '<label>Residual Value <span style="font-size:10px; font-weight:400; color:var(--muted);">Car\'s worth at end of term</span></label>',
    "residual value label explanation")

print()
print("=" * 60)
print("FIX 6: career.html — raise output x5 unlabeled")
print("=" * 60)
patch('career.html',
    '<span class="result-label">5-Year Value</span>',
    '<span class="result-label">5-Year Cumulative Value of Raise</span>',
    "raise output label clarified")
# If label is different, try alternate
c = read('career.html')
# Find the raise result label
idx = c.find('calculateRaise')
context = c[idx:idx+800] if idx != -1 else ''
print(f"  raise result context: {context[300:500]}")

print()
print("=" * 60)
print("FIX 7: career.html — freelance rate visible overhead %")
print("=" * 60)
patch('career.html',
    '<label>Billing Hours/Week</label>',
    '<label>Billing Hours/Week <span style="font-size:10px; font-weight:400; color:var(--muted);">Result adds 30% for taxes &amp; expenses</span></label>',
    "freelance overhead note on label")

print()
print("=" * 60)
print("FIX 8: marketing.html — email list value silent 3x multiplier")
print("=" * 60)
patch('marketing.html',
    '<span class="result-label">List Value (Est.)</span>',
    '<span class="result-label">List Value (3× Annual Revenue)</span>',
    "email list value 3x label")

print()
print("=" * 60)
print("FIX 9: diy.html — paint calc ignores unit selector (hardcoded ft)")
print("=" * 60)
# The calculatePaint passes 'ft' hardcoded. Need to read the actual unit selector IDs
c = read('diy.html')
idx = c.find('calculatePaint')
print(f"  paint calc context:\n{c[idx:idx+600]}")

print()
print("=" * 60)
print("FIX 10: psych.html — decision matrix uses silent 0.7/0.3 weights")
print("=" * 60)
patch('psych.html',
    'const scoreA = a1 * 0.7 + a2 * 0.3; // Sample weighting',
    'const scoreA = a1 * 0.7 + a2 * 0.3; // 70% weight to Importance, 30% to Urgency',
    "decision matrix weights clarified in code")

print()
print("=" * 60)
print("FIX 11: invest.html — crypto tax hardcoded at 30% (US short-term only)")
print("=" * 60)
patch('invest.html',
    "document.getElementById('cr-tax').innerText = formatter.format(profit * 0.3); // 30% ST tax",
    "document.getElementById('cr-tax').innerText = formatter.format(profit * 0.3); // US short-term rate ~30%; varies by country/bracket",
    "crypto tax comment clarified")
# Also fix the label
patch('invest.html',
    '<span class="result-label">Est. Tax (30%)</span>',
    '<span class="result-label">Est. Tax (30% US Short-Term Rate)</span>',
    "crypto tax label clarified")

print()
print("=" * 60)
print("FIX 12: logistics.html — meeting cost $ hardcoded not formatter")
print("=" * 60)
patch('logistics.html',
    "document.getElementById('me-out').innerText = '$' + Math.round(n * r * d);",
    "document.getElementById('me-out').innerText = formatter.format(Math.round(n * r * d));",
    "meeting cost uses formatter instead of hardcoded $")

print()
print("=" * 60)
print("FIX 13: engineering.html — Power Factor label needs range hint")
print("=" * 60)
patch('engineering.html',
    '<label>Power Factor (PF)</label>',
    '<label>Power Factor (PF) <span style="font-size:10px; font-weight:400; color:var(--muted);">0–1 · motors typ. 0.8–0.9</span></label>',
    "power factor range hint")

print()
print("=" * 60)
print("FIX 14: diy.html — paint door/window deduction label")
print("=" * 60)
patch('diy.html',
    '<label>Doors &amp; Windows (Count)</label>',
    '<label>Doors &amp; Windows <span style="font-size:10px; font-weight:400; color:var(--muted);">(count, ~20 sq ft each)</span></label>',
    "paint door/window deduction explained")

print()
print("=" * 60)
print("All fixes complete!")
print("=" * 60)
