import re

with open('dashboard_app.py', 'r') as f:
    code = f.read()

# ADD PRODUCT DICTIONARIES
prod_dicts = """
CJ_PRODUCTS = {
    "default": [
        {"title": "Premium Web Hosting (CJ)", "url": "https://www.cj.com/example", "description": "High performance hosting"}
    ]
}

DIGISTORE_PRODUCTS = {
    "default": [
        {"title": "Digital Mastery Course (Digistore24)", "url": "https://www.digistore24.com/redir/example", "description": "Learn digital marketing"}
    ]
}

IMPACT_PRODUCTS = {
    "default": [
        {"title": "Graphic Design Pro (Impact)", "url": "https://impact.com/example", "description": "Design like a pro"}
    ]
}
"""
code = code.replace("CLICKBANK_PRODUCTS = {", prod_dicts + "\nCLICKBANK_PRODUCTS = {")

# UPDATE get_affiliate_links
get_aff_old = """    return {"clickbank": cb_sample, "amazon": amz_sample, "subscriptions": sub_sample}"""
get_aff_new = """    
    cj_products = CJ_PRODUCTS.get(category, CJ_PRODUCTS["default"])
    ds_products = DIGISTORE_PRODUCTS.get(category, DIGISTORE_PRODUCTS["default"])
    imp_products = IMPACT_PRODUCTS.get(category, IMPACT_PRODUCTS["default"])
    
    cj_sample = random.sample(cj_products, min(1, len(cj_products)))
    ds_sample = random.sample(ds_products, min(1, len(ds_products)))
    
    # Impact enabled only if traffic >= 25000
    traffic = int(config.get('traffic_count', 0))
    imp_sample = random.sample(imp_products, min(1, len(imp_products))) if traffic >= 25000 else []
    
    return {
        "clickbank": cb_sample, 
        "amazon": amz_sample, 
        "subscriptions": sub_sample,
        "cj": cj_sample,
        "digistore": ds_sample,
        "impact": imp_sample
    }"""
code = code.replace(get_aff_old, get_aff_new)

with open('dashboard_app.py', 'w') as f:
    f.write(code)
print("done")
