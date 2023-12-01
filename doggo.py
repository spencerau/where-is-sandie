import csv
from datetime import datetime
from geopy.distance import geodesic
import os
import dotenv
import time  # Import the time module
#import paramiko
from ftplib import FTP, error_perm

# Function to check if the point is within the radius
def is_within_radius(point_coords, center_coords, radius_miles):
    return geodesic(point_coords, center_coords).miles <= radius_miles

# Chapman University's coordinates
chapman_university_coords = (33.7933,-117.8517)
radius_miles = 1.5  # Radius in miles

file_name = "Sandie’s AirTag _NULL_J09LF9X5P0GV.csv"
base_dir = "/Users/spencerau/FindMyHistory/log"

# Define log files
ftp_log_file = '/Users/spencerau/Documents/GitHub/where-is-sandy/logs/ftp_activity.log'
error_log_file = '/Users/spencerau/Documents/GitHub/where-is-sandy/logs/ftp_errors.log'

dotenv.load_dotenv()

# Retrieve FTP credentials
ftp_server = os.getenv('FTP_SERVER')
ftp_username = os.getenv('FTP_USERNAME')
ftp_password = os.getenv('FTP_PASSWORD')
ftp_directory = '/public_html/'


# Function to log messages to a file
def log_to_file(message, file_path):
    with open(file_path, 'a') as f:
        f.write(message + '\n')


# Prepare the file path
def createFilePath(base_dir, file_name):
    current_date = datetime.now().strftime('%Y-%m-%d')
    return os.path.join(base_dir, current_date, file_name)


# read CSV file and then return most recent point
csv_file_path = createFilePath(base_dir, file_name)

def write_to_txt(lat, lng):
    with open('/Users/spencerau/Documents/GitHub/where-is-sandy/coordinates.txt', 'w') as file:
        file.write(f"{lat},{lng}\n")


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

    #print("most recent point: ", most_recent_point)

    # Check if the most recent point is within the 1.5-mile radius of Chapman University
    if most_recent_point and is_within_radius(most_recent_point, chapman_university_coords, radius_miles):
        write_to_txt(most_recent_point[0], most_recent_point[1])
    else:
        # If the most recent point is not within the radius; write zeros to indicate this
        write_to_txt(0, 0)

    ftp_upload()


def ftp_upload():
    ftp = None
    try:
        ftp = FTP(ftp_server)
        #ftp.set_debuglevel(2)  # Set the debug level to 2 for verbose logging
        if ftp is None:
            raise Exception("Failed to establish FTP connection.")

        ftp.login(user=ftp_username, passwd=ftp_password)
        ftp.cwd(ftp_directory)
        print(f"Current FTP directory: {ftp.pwd()}")  # Print the current directory on the server

        with open('/Users/spencerau/Documents/GitHub/where-is-sandy/coordinates.txt', 'rb') as file:
            ftp.storbinary('STOR coordinates.txt', file)
            print("File uploaded successfully")  # Indicate successful upload


    except Exception as e:
        log_to_file(f"An unexpected error occurred during FTP upload: {e}", error_log_file)

    finally:
        if ftp and ftp.sock is not None:
            try:
                ftp.quit()
            except Exception as e:
                log_to_file(f"Error occurred while closing FTP connection: {e}", error_log_file)




# Call the function to read the CSV and write to the text file
readCSV(csv_file_path)

