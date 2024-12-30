import json
import os
import re

# File paths
json_path = 'updated_products.json'  # Input JSON file containing all product data
output_directory = 'product_json_files'
image_directory = 'product_images'  # Local directory for images

# Create output directory if it doesn't exist
os.makedirs(output_directory, exist_ok=True)

# Load data from updated_products.json
with open(json_path, 'r') as file:
    products_data = json.load(file)

# Helper functions to sanitize filename and SKU
def sanitize_filename(filename):
    filename = re.sub(r'<[^>]+>', '', filename)
    filename = re.sub(r'[^a-zA-Z0-9_-]', '', filename)
    return filename[:150]  # Limit to 150 characters

def sanitize_sku(sku, handle):
    # If no SKU, generate one from handle; otherwise, sanitize the provided SKU
    if not sku:
        return f"SKU_{sanitize_filename(handle)[:10].upper()}"  # Generate a default SKU based on the handle
    return re.sub(r'[^a-zA-Z0-9]', '', sku)[:70]

# Process each product
for product in products_data:
    sanitized_handle = sanitize_filename(product["Handle"])
    
    # Check for variants and assign SKU
    first_variant = product.get("variants", [{}])[0] if product.get("variants") else {}
    main_product_sku = sanitize_sku(first_variant.get("sku"), sanitized_handle) if first_variant else sanitize_sku(None, sanitized_handle)
    first_variant_price = str(first_variant.get("sizes", [{}])[0].get("price", 0.0)) if first_variant.get("sizes") else "0.0"

    # Main product structure as per the template
    product_data = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.get("Title", "Unnamed Product"),
        "description": product.get("Description", "Description not available."),
        "sku": main_product_sku,
        "mpn": main_product_sku,  # Using SKU as MPN
        "image": [os.path.join(image_directory, os.path.basename(img)) for img in product.get("main_images", [])],
        "brand": {
            "@type": "Brand",
            "name": "Man Kave"
        },
        "category": product.get("Product Category", "Miscellaneous"),
        "tags": product.get("Tags", []),
        "seoTitle": product.get("SEO Title", ""),
        "seoDescription": product.get("SEO Description", ""),
        "offers": {
            "@type": "Offer",
            "url": f"https://example.com/product-page.html?handle={sanitized_handle}",
            "priceCurrency": "USD",
            "price": first_variant_price,  # Using first variant price
            "itemCondition": "https://schema.org/NewCondition",
            "availability": "https://schema.org/InStock"
        },
        "variants": []
    }

    # Construct variants with size and color information
    for variant in product.get("variants", []):
        variant_entry = {
            "color": variant.get("color", "Default"),
            "sizes": variant.get("sizes", []),
            "sku": sanitize_sku(variant.get("sku"), sanitized_handle),
            "imageSrc": os.path.join(image_directory, os.path.basename(variant.get("imageSrc", "")))
        }
        product_data["variants"].append(variant_entry)

    # Output path for the product JSON file
    product_json_path = os.path.join(output_directory, f"product_{sanitized_handle}.json")
    
    # Save each product's JSON
    with open(product_json_path, 'w') as json_file:
        json.dump(product_data, json_file, indent=2)
    
    print(f"Product JSON file created: {product_json_path}")