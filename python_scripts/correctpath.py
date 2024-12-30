import json

# Specify the path to the JSON file
file_path = 'updated_products.json'

# Load the JSON data
with open(file_path, 'r') as file:
    products_data = json.load(file)

# Function to recursively replace backslashes with forward slashes in all strings within the JSON data
def replace_backslashes(data):
    if isinstance(data, str):
        return data.replace("\\", "/")
    elif isinstance(data, list):
        return [replace_backslashes(item) for item in data]
    elif isinstance(data, dict):
        return {key: replace_backslashes(value) for key, value in data.items()}
    return data

# Apply the function to the entire JSON structure
corrected_data = replace_backslashes(products_data)

# Save the corrected JSON data
corrected_file_path = 'updated_products_corrected.json'
with open(corrected_file_path, 'w') as file:
    json.dump(corrected_data, file, indent=4)

print(f"Corrected JSON file saved as {corrected_file_path}")