# where-is-sandie
 
## Requirements
- Run `pip3 install -r requirements.txt` to install the required packages for the Python backend
- Run `git submodule update --init --recursive --remote` to install FindMyHistory submodule fork
- Run `npm install` to install the required packages for the JS frontend

## .env File
- GEOFENCE_CENTER=33.7933,-117.8517 
- GEOFENCE_RADIUS=2       
- API_ENDPOINT_URL=https://where-is-sandy.vercel.app/api/upload_csv
- API_ENDPOINT_URL=http://localhost:3000/api/upload_csv
    - Change depending on local or vercel  
- DEVICE=Sandie’s AirTag _NULL_J09LF9X5P0GV

## .env.local File
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=Actual_API_Key

## Testing Locally
- Set .env and .env.local files
- Run `npm run dev` to start the server on localhost:3000
- Go to http://localhost:3000 to view the page