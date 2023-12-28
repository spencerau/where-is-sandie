import csv
from datetime import datetime
from geopy.distance import geodesic
import serial
import time
import os

ser = serial.Serial('/dev/cu.usbserial-10', 9600, timeout=1) 
time.sleep(2)  # Wait for the connection to establish

# Chapman University's coordinates
chapman_university_coords = (33.7933,-117.8517)
radius_miles = 1.5  # Radius in miles

file_name = "Sandie’s AirTag _NULL_J09LF9X5P0GV.csv"
gps_file_name = "Spencer’s MacBook Pro_DDE259AE-662A-4748-B3D1-079C014E39BB_NULL.csv"
base_dir = "/Users/spencerau/FindMyHistory/log"

# Define log files
error_log_file = '/Users/spencerau/Documents/GitHub/where-is-sandy/logs/ftp_errors.log'

# Function to log messages to a file
def log_to_file(message, file_path):
    with open(file_path, 'w') as f:
        f.write(message + '\n')


# Function to check if the point is within 50 feet
def is_within_feet(point_coords, center_coords, feet):
    return geodesic(point_coords, center_coords).feet <= feet

# Function to check if the point is within the radius
def is_within_radius(point_coords, center_coords, radius_miles):
    return geodesic(point_coords, center_coords).miles <= radius_miles

# Function to calculate the distance between two points
def calculate_distance(point1, point2):
    return geodesic(point1, point2).meters


# Prepare the file path
def createFilePath(base_dir, file_name):
    current_date = datetime.now().strftime('%Y-%m-%d')
    return os.path.join(base_dir, current_date, file_name)


# read CSV file and then return most recent point
csv_file_path = createFilePath(base_dir, file_name)
gps_file_path = createFilePath(base_dir, gps_file_name)


def readTxt(txt_file_path):
    with open(txt_file_path, 'r') as file:
        lines = file.readlines()
        lat, lng = lines[0].split(',')
        return (float(lat), float(lng))


def readCSV(csv_file_path):
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
                    break  # Assumes the most recent data is at the end of the file
    except Exception as e:
        print(f"Error reading the CSV file: {e}")
        return  # Exit if there is an error reading the file

    # return the most recent point as a tuple
    return most_recent_point

if __name__ == "__main__":
    next_run_time = time.time()  # Initialize the next run time

    while True:
        # Read the CSV file and check the most recent point
        airtag_coords = readCSV(csv_file_path)
        gps_coords = readCSV(gps_file_path)

        if is_within_radius(airtag_coords, chapman_university_coords, radius_miles):
            distance = calculate_distance(airtag_coords, gps_coords)
            distance_str = str(round(distance, 2))
            ser.write(distance_str.encode())
            print("Sent:", distance_str)
            ser.flush()  # Ensure data is sent immediately
        else:
            ser.write(b'0')
            ser.flush()  # Ensure data is sent immediately
        time.sleep(2)
        
        next_run_time += 1  # Schedule next run time
        time.sleep(max(next_run_time - time.time(), 0))  # Sleep until the next scheduled run time
