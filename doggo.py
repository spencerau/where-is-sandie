import csv
from datetime import datetime
from geopy.distance import geodesic
import os
import time  # Import the time module

# Function to check if the point is within the radius
def is_within_radius(point_coords, center_coords, radius_miles):
    return geodesic(point_coords, center_coords).miles <= radius_miles

# Chapman University's coordinates
chapman_university_coords = (33.7935, -117.8531)
radius_miles = 2  # Radius in miles

file_name = "Sandie’s AirTag _NULL_J09LF9X5P0GV.csv"
base_dir = "/Users/spencerau/FindMyHistory/log"

# Prepare the file path
def createFilePath(base_dir, file_name):
    current_date = datetime.now().strftime('%Y-%m-%d')
    return os.path.join(base_dir, current_date, file_name)

# read CSV file and then return most recent point
csv_file_path = createFilePath(base_dir, file_name)

def write_to_txt(lat, lng):
    with open('coordinates.txt', 'w') as file:
        file.write(f"{lat},{lng}\n")

def readCSV(csv_file_path):
    # Read the CSV file and check the most recent point
    most_recent_point = None
    while True:
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
                write_to_txt(most_recent_point[0], most_recent_point[1])
            else:
                # If the most recent point is not within the radius; print something to file to indicate that 
                write_to_txt(0, 0)

        time.sleep(60)  # Wait for 60 seconds before next iteration


readCSV(csv_file_path)
