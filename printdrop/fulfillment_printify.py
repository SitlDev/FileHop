import requests
import json

# --- CONFIGURATION ---
# Get your token from: https://printify.com/app/settings/api
PRINTIFY_API_TOKEN = "YOUR_PRINTIFY_API_TOKEN"
SHOP_ID = "YOUR_SHOP_ID" # You must create a shop first

headers = {
    "Authorization": f"Bearer {PRINTIFY_API_TOKEN}",
    "Content-Type": "application/json"
}

def get_catalog():
    """Fetches blueprints (catalog) from Printify."""
    url = "https://api.printify.com/v1/catalog/blueprints.json"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    return {"error": response.text}

def get_blueprint_details(blueprint_id):
    """Fetches details for a specific blueprint, including print providers and variants."""
    url = f"https://api.printify.com/v1/catalog/blueprints/{blueprint_id}.json"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    return {"error": response.text}

def create_printify_order(design_url, recipient_info):
    """
    Submits an order to Printify.
    Note: Printify works by creating a product FIRST, then an order.
    But for automation, we can use their 'Instant' fulfillment or sync existing products.
    """
    url = f"https://api.printify.com/v1/shops/{SHOP_ID}/orders.json"
    
    payload = {
        "external_id": "ORDER-12345",
        "line_items": [
            {
                "product_id": "EXISTING_PRODUCT_ID", # Usually you pre-sync a product
                "variant_id": 12345,
                "quantity": 1
            }
        ],
        "shipping_method": 1,
        "send_shipping_notification": False,
        "address_to": {
            "first_name": recipient_info['name'].split()[0],
            "last_name": recipient_info['name'].split()[-1] if ' ' in recipient_info['name'] else "",
            "address1": recipient_info['address1'],
            "city": recipient_info['city'],
            "state": recipient_info['state_code'],
            "country": recipient_info['country_code'],
            "zip": recipient_info['zip']
        }
    }

    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        print("Printify Order Created Successfully")
        return response.json()
    else:
        print(f"Printify Error: {response.text}")
        return {"error": response.text}

def get_order_status(order_id):
    """Checks Printify order status."""
    url = f"https://api.printify.com/v1/shops/{SHOP_ID}/orders/{order_id}.json"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()['status'] # e.g. 'on-hold', 'printing', 'shipped'
    return None

def cancel_order(order_id):
    """Cancels a Printify order if it hasn't shipped."""
    url = f"https://api.printify.com/v1/shops/{SHOP_ID}/orders/{order_id}/cancel.json"
    response = requests.post(url, headers=headers)
    if response.status_code == 200:
        print(f"Printify Order {order_id} cancelled.")
        return True
    else:
        print(f"Printify Cancellation failed: {response.text}")
        return False

if __name__ == "__main__":
    print("Printify API Implementation Ready.")
