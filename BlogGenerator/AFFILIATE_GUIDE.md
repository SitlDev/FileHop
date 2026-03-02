# Affiliate Integration Guide

This guide explains how to integrate and validate your affiliate links within the KnotStranded Blog Generator.

## 1. How the System Uses Affiliate Links

The AI article generation pipeline searches for specific markers in the generated text (like `[CB1]`, `[CB2]`, etc.) and replaces them with premium recommendation cards.

### Supported Markers:
- `[CB1]`, `[CB2]`, `[CB3]`: ClickBank product recommendation cards.
- `[AMZ1]`: Amazon affiliate recommendation cards.

## 2. Setting Up Your IDs

You must set your affiliate IDs in the **Config** tab of the dashboard or directly in `blog_settings.json`:

- **ClickBank ID**: Your ClickBank account nickname.
- **Amazon Tag**: Your Amazon Associates tracking ID (e.g., `yourtag-20`).

## 3. Validating Your Links

The system currently uses placeholder URLs which **must be updated** to generate actual commissions.

### Current Status:
The system automatically injects your ClickBank ID into the product URLs. 
- **Placeholder URL format**: `https://YOURVENDOR.hop.clickbank.net/?affiliate=l4j4n`
- **What you need to do**: Replace `YOURVENDOR` with the actual vendor name of the product you want to promote.

### Steps to Make Links Valid:
1. **Open the Affiliates Tab**: Navigate to the new **Affiliates** tab in the dashboard.
2. **Find a Product**: Use the filter to search your ClickBank or Amazon inventory.
3. **Update the Link**: 
   - Click the **"Auto-Fix"** button on any link with a `YOURVENDOR` placeholder.
   - Enter your actual ClickBank Vendor ID when prompted.
   - Alternatively, edit the **Title** or **URL** fields directly in the list.
4. **Add New Products**: Use the **"Add New Link"** button to expand your library with custom affiliate offers.
5. **Save Changes**: Click the **"Save"** button next to any item you modify to persist the changes to the central library.

### Automatic Hinting:
You can also update placeholders by adding a hint to the **Description** field of a product, such as `Vendor: MYVENDORID`. When you save the library, the system will automatically replace `YOURVENDOR` with your ID.

### Example Valid Entry (UI):
- **Network**: CLICKBANK
- **Category**: Movies
- **Title**: Netflix Secrets Masterclass
- **URL**: `https://YOURVENDOR.hop.clickbank.net/?affiliate=l4j4n`
- **Description**: Vendor: moviepro
- **Action**: Click Save -> URL becomes `https://moviepro.hop.clickbank.net/?affiliate=l4j4n`

## 4. Testing Your Links

1. Generate a test article in the **Generate** tab.
2. View the article and click the **"Check Price"** button on a recommendation card.
3. Verify that the URL that loads in your browser correctly redirects to the vendor page and includes your affiliate ID in the hoplink sequence.

## 5. Visual Excellence

To maintain the premium look of the blog, ensure every product entry in `CLICKBANK_PRODUCTS` has a high-quality `image` URL from a service like Unsplash. The system will automatically style these images into consistent, professional cards.
