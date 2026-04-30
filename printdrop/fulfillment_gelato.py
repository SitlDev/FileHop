import requests
import json

# --- CONFIGURATION ---
# Get your key from: https://dashboard.gelato.com/api
GELATO_API_KEY = "YOUR_GELATO_API_KEY"

headers = {
    "X-API-KEY": GELATO_API_KEY,
    "Content-Type": "application/json"
}

def get_catalog():
    """Fetches the product catalog from Gelato."""
    url = "https://product.gelatoapis.com/v1/products"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json().get('products', [])
    return {"error": response.text}

def get_product_details(product_uid):
    """Fetches details for a specific Gelato product."""
    url = f"https://product.gelatoapis.com/v1/products/{product_uid}"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    return {"error": response.text}

def create_gelato_order(design_url, recipient_info):
    """
    Submits an order to Gelato.
    Gelato is highly efficient for international orders.
    """
    url = "https://order.gelatoapis.com/v1/orders"
    
    payload = {
        "orderReferenceId": "ORDER-12345",
        "customerReferenceId": "CUST-123",
        "currencyIsoCode": "USD",
        "items": [
            {
                "itemReferenceId": "ITEM-1",
                "productUid": "apparel_product_uid", # e.g. 'mens-cotton-t-shirt'
                "files": [
                    {
                        "type": "preview",
                        "url": design_url
                    },
                    {
                        "type": "print",
                        "url": design_url
                    }
                ],
                "quantity": 1
            }
        ],
        "shippingAddress": {
            "firstName": recipient_info['name'].split()[0],
            "lastName": recipient_info['name'].split()[-1] if ' ' in recipient_info['name'] else "",
            "addressLine1": recipient_info['address1'],
            "city": recipient_info['city'],
            "state": recipient_info['state_code'],
            "country": recipient_info['country_code'],
            "postcode": recipient_info['zip'],
            "email": "support@printdrop.studio",
            "phone": "+15550123456"
        },
        "returnAddress": {
            "companyName": "PrintDrop Fulfillment",
            "addressLine1": "123 Business Way",
            "city": "London",
            "postcode": "EC1A 1BB",
            "country": "GB"
        }
    }

    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 201:
        print("Gelato Order Created Successfully")
        return response.json()
    else:
        print(f"Gelato Error: {response.text}")
        return None

if __name__ == "__main__":
    print("Gelato API Implementation Ready.")
