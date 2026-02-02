import csv
from datetime import datetime
from geopy.distance import geodesic
import requests
import os
from dotenv import load_dotenv
import time


load_dotenv()
geofence_center = os.getenv('GEOFENCE_CENTER')
geofence_radius_miles = float(os.getenv('GEOFENCE_RADIUS', 0.25))
api_endpoint_url = os.getenv('API_ENDPOINT_URL')
device_name = os.getenv('DEVICE')

lat, lon = map(float, geofence_center.split(','))
geofence_center_coords = (lat, lon)


def is_within_radius(point_coords, center_coords, radius_miles):
    return geodesic(point_coords, center_coords).miles <= radius_miles


def upload_csv(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': ('coordinates.csv', f)}
        response = requests.post(api_endpoint_url, files=files)
        if response.status_code != 200:
            print(f"Failed to upload: {response.status_code}")
            print(f"Response: {response.text}")


def check_and_upload():
    csv_file_path = os.path.join("FindMyHistory", "log", f"{device_name}.csv")

    try:
        with open(csv_file_path, mode='r') as csvfile:
            csvreader = csv.DictReader(csvfile)
            for row in csvreader:
                latitude = float(row.get("location|latitude"))
                longitude = float(row.get("location|longitude"))
                timestamp = row.get("location|timeStamp")

                if is_within_radius((latitude, longitude), geofence_center_coords, geofence_radius_miles):
                    temp_csv_path = os.path.join("/tmp", "coordinates_upload.csv")
                    with open(temp_csv_path, mode='w', newline='') as temp_csvfile:
                        fieldnames = ["location|latitude", "location|longitude", "location|timeStamp"]
                        writer = csv.DictWriter(temp_csvfile, fieldnames=fieldnames)
                        writer.writeheader()
                        writer.writerow({
                            "location|latitude": latitude, 
                            "location|longitude": longitude,
                            "location|timeStamp": timestamp
                        })
                    upload_csv(temp_csv_path)
                    break
                else:
                    temp_csv_path = os.path.join("/tmp", "coordinates_upload.csv")
                    with open(temp_csv_path, mode='w', newline='') as temp_csvfile:
                        fieldnames = ["location|latitude", "location|longitude", "location|timeStamp"]
                        writer = csv.DictWriter(temp_csvfile, fieldnames=fieldnames)
                        writer.writeheader()
                        writer.writerow({
                            "location|latitude": 0, 
                            "location|longitude": 0,
                            "location|timeStamp": timestamp
                        })
                    upload_csv(temp_csv_path)
                    break
    except Exception as e:
        print(f"Error reading the CSV file: {e}")


if __name__ == "__main__":
    while True:
        check_and_upload()
        time.sleep(1)
