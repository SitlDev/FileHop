import os
import re
import json

meta_map = {
    'index.html': {
        'title': '100+ Free Professional Calculators | YourCalc',
        'desc': 'Free professional calculators for finance, health, engineering, and more. 100+ tools, verified formulas, no account required. All calculations run in your browser.'
    },
    'finance.html': {
        'title': 'Finance & Mortgage Calculators | YourCalc',
        'desc': 'Calculate mortgage payments, compound interest, FIRE numbers, 401k balances, and tax estimates with free verified finance calculators.'
    },
    'health.html': {
        'title': 'Health & Body Calculators | YourCalc',
        'desc': 'Free BMI calculator, TDEE calculator, macro planner, body fat estimator, and daily water intake calculator using WHO-standard formulas.'
    },
    'fitness.html': {
        'title': 'Fitness & Training Calculators | YourCalc',
        'desc': 'VO2 max, 1-rep max, race pace, heart rate zones, and calorie burn calculators for athletes and gym-goers.'
    },
    'medical.html': {
        'title': 'Medical & Clinical Calculators | YourCalc',
        'desc': 'Clinical calculators for drug dosage, IV drip rates, ideal body weight, creatinine clearance, and caloric deficit. Based on peer-reviewed pharmacokinetic formulas.'
    },
    'business.html': {
        'title': 'Small Business Calculators | YourCalc',
        'desc': 'Burn rate, break-even, LTV/CAC, and profit margin calculators for founders and small business owners.'
    },
    'legal-tax.html': {
        'title': 'Legal & Tax Calculators | YourCalc',
        'desc': 'Self-employment tax, capital gains, depreciation, LLC vs S-Corp, and QBI deduction calculators for 2026.'
    },
    'about.html': {
        'title': 'About YourCalc — A KnotStranded LLC Product',
        'desc': 'YourCalc is a free calculator library built by KnotStranded LLC. 100+ verified tools. No accounts. No data stored.'
    }
}

og_template = """
    <!-- SEO & Canonical -->
    <link rel="canonical" href="https://yourcalc.info/{filename}" />
    <meta name="description" content="{desc}" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="YourCalc" />
    <meta property="og:url" content="https://yourcalc.info/{filename}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{desc}" />
    <meta property="og:image" content="https://yourcalc.info/og-image.png" />
    <!-- TODO: Create og-image.png 1200x630 -->

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{desc}" />
    <meta name="twitter:image" content="https://yourcalc.info/og-image.png" />
"""

website_schema = """
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "YourCalc",
      "url": "https://yourcalc.info",
      "description": "Free professional calculators for finance, health, engineering, and more.",
      "publisher": {
        "@type": "Organization",
        "name": "KnotStranded LLC",
        "url": "https://yourcalc.info"
      }
    }
    </script>
"""

app_schema_template = """
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "{calc_name} Calculator",
      "url": "https://yourcalc.info/{filename}#{anchor}",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "description": "Calculate your {calc_name_lower} with this free professional tool."
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does the {calc_name} Calculator work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "This calculator uses verified formulas to provide accurate {calc_name_lower} estimates based on your custom inputs."
          }
        },
        {
          "@type": "Question",
          "name": "Who should use the {calc_name} Calculator?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It is designed for professionals and individuals looking to perform reliable {calc_name_lower} calculations instantly."
          }
        }
      ]
    }
    </script>
"""

def inject_seo_tags():
    for filename in os.listdir('.'):
        if not filename.endswith('.html'):
            continue
            
        with open(filename, 'r') as f:
            content = f.read()

        # Clean existing description, canonical, OG tags if any to avoid duplicates
        content = re.sub(r'<meta name="description".*?>\n?', '', content)
        content = re.sub(r'<link rel="canonical".*?>\n?', '', content)
        content = re.sub(r'<meta property="og:.*?>\n?', '', content)
        content = re.sub(r'<meta name="twitter:.*?>\n?', '', content)
        
        # Determine Title and Desc
        if filename in meta_map:
            title = meta_map[filename]['title']
            desc = meta_map[filename]['desc']
        else:
            cat_match = re.search(r'<h1>(.*?)</h1>', content)
            cat_name = "Calculators"
            if cat_match:
                cat_name = re.sub(r'<[^>]+>', '', cat_match.group(1)).strip()
            title = f"{cat_name} Calculators | YourCalc"
            desc = f"Free, verified {cat_name.lower()} calculators. No account required. All math runs locally in your browser."

        og_block = og_template.format(filename="" if filename=="index.html" else filename, title=title, desc=desc)
        
        # Inject JSON-LD Schema
        schemas = []
        if filename == 'index.html':
            schemas.append(website_schema)
        else:
            # Check if it's a category page by finding calc-containers
            tabs = re.findall(r'<button class="tab-btn(?: active)?" onclick="showTab\(\'([a-zA-Z0-9_-]+)\', event\)">([^<]+)</button>', content)
            names_map = {tab_id: tab_name.strip() for tab_id, tab_name in tabs}
            
            for m in re.finditer(r'<div id="([a-zA-Z0-9_-]+)" class="calc-container(?: active)?">', content):
                anchor = m.group(1)
                calc_name = names_map.get(anchor, anchor.capitalize())
                schema_block = app_schema_template.format(
                    calc_name=calc_name, 
                    calc_name_lower=calc_name.lower(), 
                    filename=filename, 
                    anchor=anchor
                )
                schemas.append(schema_block)
                
        # Insert all tags right before </head>
        all_tags = og_block + ''.join(schemas)
        content = content.replace('</head>', all_tags + '\n</head>')
        
        with open(filename, 'w') as f:
            f.write(content)

inject_seo_tags()
print("Phase 2 SEO Part 2 completed: Meta tags, Canonical, OG, JSON-LD schemas injected.")
