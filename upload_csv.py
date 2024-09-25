import csv
from datetime import datetime
from geopy.distance import geodesic
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Read environment variables from .env
geofence_center = os.getenv('GEOFENCE_CENTER')
geofence_radius_miles = float(os.getenv('GEOFENCE_RADIUS', 1.5))  # Default to 1.5 if not set

#print(f"Radius: {geofence_radius_miles}")
api_endpoint_url = os.getenv('API_ENDPOINT_URL')
device_name = os.getenv('DEVICE')


# Parse geofence center coordinates
lat, lon = map(float, geofence_center.split(','))
geofence_center_coords = (lat, lon)
#print(f"CENTER: {geofence_center_coords}")



# Function to check if the point is within the radius
def is_within_radius(point_coords, center_coords, radius_miles):
    return geodesic(point_coords, center_coords).miles <= radius_miles


# Upload CSV file to the remote server
def upload_csv(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(api_endpoint_url, files=files)
        if response.status_code == 200:
            print("Upload successful")
        else:
            print(f"Failed to upload: {response.status_code}")


# Read CSV, check geofence, and upload if within geofence
def check_and_upload():
    # Get today's date
    current_date = datetime.now().strftime('%Y-%m-%d')
    csv_file_path = os.path.join("FindMyHistory", "log", current_date, f"{device_name}.csv")

    try:
        with open(csv_file_path, mode='r') as csvfile:
            csvreader = csv.DictReader(csvfile)
            for row in csvreader:
                latitude = float(row.get("location|latitude"))
                longitude = float(row.get("location|longitude"))

                #print(f"latitude: {latitude}")
                #print(f"longitude: {longitude}")

                distance = geodesic(geofence_center_coords, (latitude, longitude)).miles

                #print(f"distance: {distance}")

                # Check if the point is within the geofence
                if is_within_radius((latitude, longitude), geofence_center_coords, geofence_radius_miles):
                    #print("Sandie is on campus")
                    upload_csv(csv_file_path)  # Upload CSV file
                    break  # We found a valid point and uploaded, no need to continue
                #else:
                    #print("Sandie is not on campus")
    except Exception as e:
        print(f"Error reading the CSV file: {e}")

if __name__ == "__main__":
    check_and_upload()
