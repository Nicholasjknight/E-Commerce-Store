import json
import os

# Define the directory containing the JSON files
directory_path = 'product_json_files'

# Function to recursively replace backslashes with forward slashes in all strings within the JSON data
def replace_backslashes(data):
    if isinstance(data, str):
        return data.replace("\\", "/")
    elif isinstance(data, list):
        return [replace_backslashes(item) for item in data]
    elif isinstance(data, dict):
        return {key: replace_backslashes(value) for key, value in data.items()}
    return data

# Process each JSON file in the directory
for filename in os.listdir(directory_path):
    if filename.endswith('.json'):
        file_path = os.path.join(directory_path, filename)
        
        # Load the JSON data
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        # Apply the backslash replacement
        corrected_data = replace_backslashes(data)
        
        # Save the corrected data back to the file
        with open(file_path, 'w') as file:
            json.dump(corrected_data, file, indent=4)
        
        print(f"Corrected backslashes in: {filename}")

print("All files in the product_json_files folder have been processed.")
