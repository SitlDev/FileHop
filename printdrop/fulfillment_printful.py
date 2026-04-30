import requests
import json

# --- CONFIGURATION ---
# Replace with your actual Printful API Key (Bearer Token)
PRINTFUL_API_KEY = "YOUR_PRINTFUL_API_KEY"
BASE_URL = "https://api.printful.com"

headers = {
    "Authorization": f"Bearer {PRINTFUL_API_KEY}",
    "Content-Type": "application/json"
}

def get_catalog():
    """Fetches the main product catalog from Printful."""
    response = requests.get(f"{BASE_URL}/products", headers=headers)
    if response.status_code == 200:
        return response.json().get('result', [])
    return {"error": response.text}

def get_product_details(product_id):
    """Fetches specific product details including variants."""
    response = requests.get(f"{BASE_URL}/products/{product_id}", headers=headers)
    if response.status_code == 200:
        return response.json().get('result', {})
    return {"error": response.text}

def create_order(design_url, recipient_info):
    """
    Submits a POST request to create a new order on Printful.
    design_url: Must be a publicly accessible URL (S3, Dropbox, etc.)
    """
    payload = {
        "recipient": {
            "name": recipient_info['name'],
            "address1": recipient_info['address1'],
            "city": recipient_info['city'],
            "state_code": recipient_info['state_code'],
            "country_code": recipient_info['country_code'],
            "zip": recipient_info['zip']
        },
        "items": [
            {
                "variant_id": 4012, # Example: Bella + Canvas 3001 Black M
                "quantity": recipient_info.get('quantity', 1),
                "files": [{"url": design_url}]
            }
        ],
        "packing_slip": {
            "email": "support@printdrop.studio",
            "phone": "+1 (555) 012-3456",
            "message": "Thanks for ordering from PrintDrop! We hope you love your new custom shirt."
        }
    }

    response = requests.post(f"{BASE_URL}/orders", headers=headers, json=payload)
    
    if response.status_code == 200:
        print("Order successfully created!")
        return response.json()
    else:
        print(f"Failed to create order. Status code: {response.status_code}")
        return {"error": response.text}

def get_order_status(order_id):
    """Checks the status of an existing order."""
    response = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
    if response.status_code == 200:
        return response.json()['result']['status']
    return None

def cancel_order(order_id):
    """
    Attempts to cancel an order. 
    Only works if the order hasn't entered production yet.
    """
    response = requests.delete(f"{BASE_URL}/orders/{order_id}", headers=headers)
    if response.status_code == 200:
        print(f"Order {order_id} cancelled.")
        return True
    else:
        print(f"Cancellation failed: {response.text}")
        return False

if __name__ == "__main__":
    # Example Usage:
    # 1. You would first upload your design_001.png to a cloud bucket
    # 2. Provide the URL here
    test_design_url = "https://your-bucket.s3.amazonaws.com/designs/my_design.png"
    
    test_recipient = {
        "name": "John Doe",
        "address1": "123 Main St",
        "city": "Los Angeles",
        "state_code": "CA",
        "country_code": "US",
        "zip": "90001"
    }
    
    # Uncomment to run (requires valid API KEY)
    # create_order(test_design_url, test_recipient)
    print("Fulfillment template ready. Add your API Key to test.")
