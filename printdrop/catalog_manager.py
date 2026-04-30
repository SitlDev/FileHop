import os
import json
import time
from concurrent.futures import ThreadPoolExecutor

# Try to import fulfillment modules
try:
    import fulfillment_printful as printful
    HAS_PRINTFUL = True
except ImportError:
    HAS_PRINTFUL = False

try:
    import fulfillment_printify as printify
    HAS_PRINTIFY = True
except ImportError:
    HAS_PRINTIFY = False

try:
    import fulfillment_gelato as gelato
    HAS_GELATO = True
except ImportError:
    HAS_GELATO = False

CACHE_FILE = "catalog_cache.json"
CACHE_TTL = 3600 * 24 # 24 hours

def _load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            try:
                data = json.load(f)
                if time.time() - data.get("timestamp", 0) < CACHE_TTL:
                    return data.get("catalog")
            except:
                pass
    return None

def _save_cache(catalog):
    with open(CACHE_FILE, "w") as f:
        json.dump({"timestamp": time.time(), "catalog": catalog}, f, indent=2)

def get_unified_catalog():
    """Aggregates catalog data from all available providers."""
    cached = _load_cache()
    if cached:
        return cached

    unified = {
        "printful": [],
        "printify": [],
        "gelato": []
    }

    def fetch_printful():
        if HAS_PRINTFUL:
            return printful.get_catalog()
        return []

    def fetch_printify():
        if HAS_PRINTIFY:
            return printify.get_catalog()
        return []

    def fetch_gelato():
        if HAS_GELATO:
            return gelato.get_catalog()
        return []

    with ThreadPoolExecutor(max_workers=3) as executor:
        f_printful = executor.submit(fetch_printful)
        f_printify = executor.submit(fetch_printify)
        f_gelato = executor.submit(fetch_gelato)

        unified["printful"] = f_printful.result()
        unified["printify"] = f_printify.result()
        unified["gelato"] = f_gelato.result()

    _save_cache(unified)
    return unified

def get_provider_product(provider, product_id):
    """Fetches detailed info for a specific product from a specific provider."""
    if provider == "printful" and HAS_PRINTFUL:
        return printful.get_product_details(product_id)
    if provider == "printify" and HAS_PRINTIFY:
        return printify.get_blueprint_details(product_id)
    if provider == "gelato" and HAS_GELATO:
        return gelato.get_product_details(product_id)
    return {"error": "Provider not available or product not found"}

if __name__ == "__main__":
    print("Catalog Manager initialized.")
    # Example: print(json.dumps(get_unified_catalog(), indent=2))
