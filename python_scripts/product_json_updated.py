
import json
import os

# File paths
json_path = 'updated_products.json'  # Input JSON file containing all product data
output_directory = 'product_json_files'  # Directory to save individual product JSON files
exclude_file = 'products.json'  # File that already has the correct format

# Create output directory if it doesn't exist
os.makedirs(output_directory, exist_ok=True)

# Load data from updated_products.json
with open(json_path, 'r') as file:
    products_data = json.load(file)

# Process each product and create JSON file
for product in products_data:
    # Extract the necessary fields according to `updated_products.json` format
    handle = product.get("Handle")
    title = product.get("Title")
    
    # Skip if Handle or Title is missing
    if not handle or not title:
        print(f"Skipping product due to missing 'Handle' or 'Title' in product: {product}")
        continue
    
    # Prepare the data structure for each product JSON
    product_data = {
        "Handle": handle,
        "Title": title,
        "Description": product.get("Description", ""),
        "Vendor": "Man Kave",
        "Product Category": product.get("Product Category", ""),
        "Tags": product.get("Tags", []),
        "SEO Title": product.get("SEO Title", ""),
        "SEO Description": product.get("SEO Description", ""),
        "main_images": product.get("main_images", []),
        "variants": product.get("variants", []),
        "custom_product": True,
        "identifier_exists": "false"
    }

    # Generate filename from Handle
    file_name = f"{handle}.json"

    # Save each product to its own JSON file in the specified directory
    with open(os.path.join(output_directory, file_name), 'w') as outfile:
        json.dump(product_data, outfile, indent=4)

