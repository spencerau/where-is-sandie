import csv
from datetime import datetime
from geopy.distance import geodesic
import os

# Function to check if the point is within the radius
def is_within_radius(point_coords, center_coords, radius_miles):
    return geodesic(point_coords, center_coords).miles <= radius_miles

# Chapman University's coordinates
chapman_university_coords = (33.7935, -117.8531)
radius_miles = 1  # Radius in miles

# Prepare the file path
current_date = datetime.now().strftime('%Y-%m-%d')
file_name = "Spencer’s MacBook Pro_DDE259AE-662A-4748-B3D1-079C014E39BB_NULL.csv"
base_dir = "/Users/spencerau/FindMyHistory/log"
csv_file_path = os.path.join(base_dir, current_date, file_name)



# Read the CSV file and check the most recent point
most_recent_point = None
try:
    with open(csv_file_path, mode='r', encoding='utf-8-sig') as csvfile:
        csvreader = csv.DictReader(csvfile)
        for row in csvreader:
            # Assuming the columns for latitude and longitude have "location|" as a prefix
            latitude = row.get("location|latitude")
            longitude = row.get("location|longitude")
            
            # Update the most recent point
            if latitude and longitude:
                most_recent_point = (float(latitude), float(longitude))
except Exception as e:
    print(f"Error reading the CSV file: {e}")

print("most recent point: ", most_recent_point)

# Check if the most recent point is within the 1-mile radius of Chapman University
if most_recent_point:
    if is_within_radius(most_recent_point, chapman_university_coords, radius_miles):
        result = "The most recent point is within the 1-mile radius of Chapman University."
    else:
        result = "The most recent point is outside the 1-mile radius of Chapman University."
else:
    result = "No valid location data found in the CSV file."

print(result)