import fulfillment_printful as printful
import fulfillment_printify as printify
import fulfillment_gelato as gelato

# ══════════════════════════════════════════════════════════════
# PRODUCT MAPPING SCHEMA
# ══════════════════════════════════════════════════════════════
# This maps PrintDrop local product IDs + Tiers to Provider-specific IDs.
# Note: Real IDs vary by color/size, so we define the "Base" product here.

PRODUCT_MAP = {
    "tee": {
        "essential": {
            "printful": {"product_id": 71, "variant_id": 4012}, # Gildan 5000
            "printify": {"blueprint_id": 6, "variant_id": 10211}, # Gildan 5000
            "gelato": {"product_uid": "apparel_mens_cotton-t-shirt"}
        },
        "retail": {
            "printful": {"product_id": 11, "variant_id": 268}, # B+C 3001
            "printify": {"blueprint_id": 12, "variant_id": 1178}, # B+C 3001
            "gelato": {"product_uid": "apparel_mens_premium-cotton-t-shirt"}
        },
        "heavyweight": {
            "printful": {"product_id": 367, "variant_id": 10041}, # Comfort Colors 1717
            "printify": {"blueprint_id": 218, "variant_id": 37233}, # Comfort Colors 1717
            "gelato": {"product_uid": "apparel_mens_heavyweight-cotton-t-shirt"}
        }
    },
    "hoodie": {
        "essential": {
            "printful": {"product_id": 103, "variant_id": 3762}, # Gildan 18500
            "printify": {"blueprint_id": 37, "variant_id": 11394}, # Gildan 18500
            "gelato": {"product_uid": "apparel_mens_heavy-blend-hoodie"}
        }
    },
    "mug": {
        "standard": {
            "printful": {"product_id": 19, "variant_id": 1320}, # 11oz White Mug
            "printify": {"blueprint_id": 68, "variant_id": 13020}, # 11oz White Mug
            "gelato": {"product_uid": "drinkware_mug_11oz_white"}
        }
    }
    # ... more mappings can be added here
}

def smart_route(country_code):
    """Determines the best provider based on country."""
    c = (country_code or "US").upper().strip()
    
    # Priority 1: Printful for US/MX
    if c in ["US", "MX"]:
        return "printful", f"Printful (US/MX) — Fast domestic shipping for {c}."
    
    # Priority 2: Gelato for EU/UK/AU/CA/NZ
    if c in ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE",
             "IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
             "GB","NO","CH","AU","NZ","CA"]:
        return "gelato", f"Gelato (Local Fulfillment) — Optimized for {c}."
    
    # Priority 3: Printify for Global
    return "printify", f"Printify (Global) — Worldwide network coverage."

def fulfill_one_click(order):
    """
    Main entry point for automated fulfillment.
    Takes an order object and routes it to the correct provider with mapped IDs.
    """
    provider, reason = smart_route(order.get('customer_country', 'US'))
    product_id = order.get('product', 'tee')
    tier = order.get('tier', 'essential')
    
    # Get the mapping
    mapping = PRODUCT_MAP.get(product_id, {}).get(tier, {}).get(provider)
    if not mapping:
        # Fallback to standard tier if specific tier not found
        mapping = PRODUCT_MAP.get(product_id, {}).get("standard", {}).get(provider)
    
    if not mapping:
        return {"error": f"No mapping found for {product_id} ({tier}) on {provider}"}

    recipient_info = {
        "name": order['customer_name'],
        "address1": order['recipient']['address1'],
        "city": order['customer_city'],
        "state_code": order['recipient'].get('state_code', ''),
        "country_code": order['customer_country'],
        "zip": order['recipient']['zip'],
        "quantity": order.get('quantity', 1)
    }

    design_url = order.get('design_url')
    if not design_url:
        return {"error": "Design URL missing. Fulfillment requires a public image link."}

    # Call the specific provider script
    if provider == "printful":
        # Note: In a real app, you'd need to resolve the exact variant_id based on color/size
        return printful.create_order(design_url, recipient_info)
    
    if provider == "printify":
        return printify.create_printify_order(design_url, recipient_info)
    
    if provider == "gelato":
        return gelato.create_gelato_order(design_url, recipient_info)

    return {"error": "Unknown provider"}

if __name__ == "__main__":
    print("POD Service Mapping Engine Ready.")
