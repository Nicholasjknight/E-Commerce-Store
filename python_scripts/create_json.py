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

# Helper function to sanitize file names
def sanitize_filename(filename):
    # Remove any HTML tags, non-alphanumeric characters, or special symbols except hyphens and underscores
    filename = re.sub(r'<[^>]+>', '', filename)  # Remove HTML tags
    filename = re.sub(r'[^a-zA-Z0-9_-]', '', filename)  # Keep only alphanumeric, hyphens, and underscores
    return filename[:150]  # Limit filename length to 150 characters

# Helper function to safely convert prices
def safe_convert_to_float(value):
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0

# Group by 'Handle' to create a separate JSON for each product
for handle, group in products_df.groupby('Handle'):
    # Sanitize the handle to create a valid file name
    sanitized_handle = sanitize_filename(handle)

    # Main product information
    product_data = {
        "title": group.iloc[0]['Title'] or "Unnamed Product",
        "description": group.iloc[0]['Body (HTML)'] or "Description not available.",
        "price": safe_convert_to_float(group.iloc[0]['Variant Price']),  # Use safe conversion function
        "variants": []
    }

    # Adding variant details
    for _, row in group.iterrows():
        variant = {
            "color": row['Option1 Value'] or "Default",
            "size": row['Option2 Value'] or "Default",
            "imageSrc": row['Image Src'].replace("Ecommerce2/", "") if row['Image Src'] else "product_images/default_image.webp"
        }
        product_data["variants"].append(variant)

    # Define the output path for each product's JSON file
    product_json_path = os.path.join(output_directory, f"product_{sanitized_handle}.json")

    # Save individual product JSON file
    with open(product_json_path, 'w') as json_file:
        json.dump(product_data, json_file, indent=2)

    print(f"Product JSON file created: {product_json_path}")
