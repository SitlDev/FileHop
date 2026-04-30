# API Setup Guide

To enable live fulfillment and catalog integration, you need to configure your API keys in the environment or directly in the fulfillment scripts.

## Printful
1.  Go to [Printful Developers](https://www.printful.com/dashboard/settings/api).
2.  Create an API Token (Bearer).
3.  Set it in `fulfillment_printful.py`:
    ```python
    PRINTFUL_API_KEY = "your_token_here"
    ```

## Printify
1.  Go to [Printify API Settings](https://printify.com/app/settings/api).
2.  Generate a Personal Access Token.
3.  Get your **Shop ID** from the URL when viewing your shop in Printify.
4.  Set them in `fulfillment_printify.py`:
    ```python
    PRINTIFY_API_TOKEN = "your_token_here"
    SHOP_ID = "your_shop_id_here"
    ```

## Gelato
1.  Go to [Gelato API Keys](https://dashboard.gelato.com/api).
2.  Generate a new API Key.
3.  Set it in `fulfillment_gelato.py`:
    ```python
    GELATO_API_KEY = "your_key_here"
    ```

---

## Technical Integration
The system uses `catalog_manager.py` to aggregate these catalogs. 
- **Caching**: The catalog is cached for 24 hours in `catalog_cache.json` to prevent rate limiting.
- **Unified API**: The backend exposes `/api/catalog` which the Admin Dashboard uses to display live products.
- **Sanitization**: Local items in `catalog.js` with no fulfillment partners have been removed to ensure 100% automated production readiness.
