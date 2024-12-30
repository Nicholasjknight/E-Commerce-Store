import pandas as pd
import json
import numpy as np
import os
import re

# Specify file paths
csv_path = 'updated_products.csv'
output_directory = 'product_json_files'

# Create the output directory if it doesn't exist
os.makedirs(output_directory, exist_ok=True)

# Load and clean the CSV
products_df = pd.read_csv(csv_path)
products_df = products_df.replace({np.nan: None})

# Helper function to sanitize file names and SKUs
def sanitize_filename(filename):
    filename = re.sub(r'<[^>]+>', '', filename)  # Remove HTML tags
    filename = re.sub(r'[^a-zA-Z0-9_-]', '', filename)  # Keep only alphanumeric, hyphens, and underscores
    return filename[:150]  # Limit filename length to 150 characters

def sanitize_sku(sku):
    if sku:
        sku = re.sub(r'[^a-zA-Z0-9]', '', sku)  # Remove any non-alphanumeric characters
        return sku[:70]  # Adjust length to within Google SEO-friendly limits (typically under 70 characters)
    return "N/A"

# Helper function to safely convert prices
def safe_convert_to_float(value):
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0

# Check if 'Variant Inventory Qty' column exists
inventory_column_exists = 'Variant Inventory Qty' in products_df.columns

# Group by 'Handle' to create a separate JSON for each product
for handle, group in products_df.groupby('Handle'):
    sanitized_handle = sanitize_filename(handle)

    # Main product information
    product_data = {
        "title": group.iloc[0]['Title'] or "Unnamed Product",
        "description": group.iloc[0]['Body (HTML)'] or "Description not available.",
        "sku": sanitize_sku(group.iloc[0]['Variant SKU']) if 'Variant SKU' in group.columns else "N/A",
        "availability": "InStock" if not inventory_column_exists or group.iloc[0].get('Variant Inventory Qty', 1) > 0 else "OutOfStock",
        "main_images": [],
        "variants": []
    }

    # Adding main images (limit to 10 and remove "Ecommerce2/" prefix)
    main_images = group['Image Src'].dropna().unique()[:10]
    product_data["main_images"] = [img.replace("Ecommerce2/", "") for img in main_images]

    # Group variants by unique color and list sizes and prices under each color
    color_variants = {}
    for _, row in group.iterrows():
        color = row['Option1 Value'] or "Default"
        size = row['Option2 Value'] or "Default"
        price = safe_convert_to_float(row['Variant Price'])
        image_src = row['Variant Image'].replace("Ecommerce2/", "") if row['Variant Image'] else None

        if color not in color_variants:
            color_variants[color] = {
                "color": color,
                "sizes": [],
                "imageSrc": image_src,
                "price": []
            }

        # Append the size and price information for each size variant
        color_variants[color]["sizes"].append({
            "size": size,
            "price": price
        })

    # Convert color variants dictionary to a list format for JSON compatibility
    product_data["variants"] = list(color_variants.values())

    # Define the output path for each product's JSON file
    product_json_path = os.path.join(output_directory, f"product_{sanitized_handle}.json")

    # Save individual product JSON file
    with open(product_json_path, 'w') as json_file:
        json.dump(product_data, json_file, indent=2)

    print(f"Product JSON file created: {product_json_path}")
