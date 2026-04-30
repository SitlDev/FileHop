#!/usr/bin/env python3
"""Fix LaTeX notation, auto.html MPG visibility, survival formula, and add input helpers."""
import re, os

BASE = '/Users/amn/Documents/GitHub/Claude/CalculatorPages'

def read(fn):
    with open(os.path.join(BASE, fn)) as f:
        return f.read()

def write(fn, c):
    with open(os.path.join(BASE, fn), 'w') as f:
        f.write(c)

def patch_str(fn, old, new, label):
    c = read(fn)
    if old not in c:
        print(f"  SKIP {fn}: '{label}' pattern not found")
        return
    write(fn, c.replace(old, new, 1))
    print(f"  OK   {fn}: {label}")

def patch_re(fn, pattern, replacement, label, flags=0):
    c = read(fn)
    new_c, n = re.subn(pattern, replacement, c, flags=flags)
    if n == 0:
        print(f"  SKIP {fn}: '{label}' regex not matched")
        return
    write(fn, new_c)
    print(f"  OK   {fn}: {label} ({n} replacement{'s' if n>1 else ''})")

print("=== 1. Culinary LaTeX ===")
patch_str('culinary.html',
    r'($100\%$). This allows bakers to scale recipes up or down infinitely without losing the balance of hydration and seasoning. A hydration of $70\%$ is typical for crusty artisanal bread.',
    r'(flour = 100%). This allows bakers to scale recipes up or down infinitely without losing the balance of hydration and seasoning. A hydration of 70% is typical for crusty artisanal bread.',
    "baker's % latex")

patch_str('culinary.html',
    r'adding $15-25\%$ of the total volume',
    r'adding 15–25% of the total volume',
    "batch cocktail latex")

print("\n=== 2. Pets LaTeX ===")
c = read('pets.html')
c = re.sub(
    r'based on the RER formula: \$70 \\times \(\\text\{weight in kg\}\)\^\{0\.75\}\$\.',
    r'based on the <strong>RER formula: 70 &times; (weight in kg)<sup>0.75</sup></strong>.',
    c
)
write('pets.html', c)
print("  OK   pets.html: RER formula latex")

print("\n=== 3. Survival LaTeX ===")
c = read('survival.html')
# $9.8 \text{ m/s}^2$  → 9.8 m/s²
c = c.replace(r'$9.8 \text{ m/s}^2$', '9.8 m/s²')
# $8 \text{ drops per gallon}$ → 8 drops per gallon
c = c.replace(r'$8 \text{ drops per gallon}$', '8 drops per gallon')
# $16$ → 16
c = c.replace(r'$16$', '16')
# $1:10,000$ → 1:10,000
c = c.replace(r'$1:10,000$', '1:10,000')
# $8.25\%$ → 8.25%
c = c.replace(r'$8.25\%$', '8.25%')
write('survival.html', c)
print("  OK   survival.html: all LaTeX formulas")

print("\n=== 4. Business LaTeX ===")
c = read('business.html')
c = c.replace(r'$100\%$', '100%')
c = c.replace(r'$50\%$', '50%')
c = c.replace(r'$3:1$', '3:1')
c = c.replace(r'$1.0$', '1.0')
c = c.replace(r'$5.0$', '5.0')
write('business.html', c)
print("  OK   business.html: LaTeX percentages and ratios")

print("\n=== 5. Invest LaTeX ===")
c = read('invest.html')
c = c.replace(r'$60\%$', '60%')
c = c.replace(r'$75\%$', '75%')
write('invest.html', c)
print("  OK   invest.html: LaTeX percentages")

print("\n=== 6. Academic LaTeX ===")
c = read('academic.html')
c = re.sub(r'\$10 \\+times \\+sqrt\{x\}\$', '10 &times; &radic;<span style="text-decoration:overline">x</span>', c)
c = re.sub(r'\$100 \\+text\{ remains \} 100\$', '100 remains 100', c)
write('academic.html', c)
print("  OK   academic.html: square root formula")

print("\n=== 7. Logistics LaTeX ===")
c = read('logistics.html')
c = c.replace(r'$\sqrt{(2DS)/H}$', '<strong>&radic;(2DS/H)</strong>')
write('logistics.html', c)
print("  OK   logistics.html: EOQ formula")

print("\n=== 8. Gaming LaTeX ===")
c = read('gaming.html')
c = c.replace(r'$1 - (1-p)^n$', '<strong>1 &minus; (1&minus;p)<sup>n</sup></strong>')
write('gaming.html', c)
print("  OK   gaming.html: probability formula")

print("\n=== 9. auto.html MPG result panel not shown ===")
c = read('auto.html')
# Find calculateMPG and inject the classList.add visible before the closing });
# Look for the closing of the checkGate callback in calculateMPG
old = 'document.getElementById(\'mp-out\').innerText = (dist / fuel).toFixed(1) + " Unit/Unit"\n                }\n            });\n        }'
new = 'document.getElementById(\'mp-out\').innerText = (dist / fuel).toFixed(1) + " Unit/Unit"\n                }\n                document.getElementById(\'mpg-results\').classList.add(\'visible\');\n            });\n        }'
if old in c:
    write('auto.html', c.replace(old, new, 1))
    print("  OK   auto.html: MPG result panel now shown")
else:
    # Try with different whitespace
    c2 = re.sub(
        r'(\.innerText = \(dist / fuel\)\.toFixed\(1\) \+ " Unit/Unit"\s*\}\s*\n)(\s*\}\);)',
        r'\1                document.getElementById("mpg-results").classList.add("visible");\n\2',
        c
    )
    if c2 != c:
        write('auto.html', c2)
        print("  OK   auto.html: MPG result panel (regex)")
    else:
        print("  FAIL auto.html: could not fix MPG visibility")

print("\n=== Done! ===")
