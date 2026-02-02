// pages/api/get_coordinates.js

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { lat, lon, ts, use_center } = req.query;

  if (use_center === '1' || use_center === 'true') {
    const center = process.env.GEOFENCE_CENTER || '';
    const parts = center.split(',').map((p) => p.trim());
    if (parts.length === 2) {
      const latitude = parseFloat(parts[0]);
      const longitude = parseFloat(parts[1]);
      const updated_at = ts || new Date().toISOString();

      const header = 'location|latitude,location|longitude,updated_at\n';
      const row = `${latitude},${longitude},${updated_at}\n`;

      res.setHeader('Content-Type', 'text/csv');
      res.status(200).send(header + row);
      return;
    }
  }

  if (lat && lon) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const updated_at = ts || new Date().toISOString();

    const header = 'location|latitude,location|longitude,updated_at\n';
    const row = `${latitude},${longitude},${updated_at}\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(header + row);
    return;
  }

  // Use different paths for development vs production
  const isDev = process.env.NODE_ENV === 'development';
  const csvPath = isDev 
    ? path.join(process.cwd(), 'FindMyHistory', 'log', 'Sandies_Airtag_New_NULL_J09LF9LFP0GV.csv')
    : path.join('/tmp', 'coordinates.csv');

  if (fs.existsSync(csvPath)) {
    let csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split(/\r?\n/).filter((l) => l.trim() !== '');
    
    if (lines.length >= 2) {
      const headers = lines[0].split(',');
      const rowParts = lines[1].split(',');
      
      const latIdx = headers.findIndex((h) => h === 'location|latitude');
      const lonIdx = headers.findIndex((h) => h === 'location|longitude');
      const tsIdx = headers.findIndex((h) => h === 'location|timeStamp');
      
      let latitude = latIdx >= 0 ? parseFloat(rowParts[latIdx]) : 0;
      let longitude = lonIdx >= 0 ? parseFloat(rowParts[lonIdx]) : 0;
      
      // Parse the FindMy timestamp (milliseconds since epoch)
      let timestamp = new Date().toISOString();
      if (tsIdx >= 0 && rowParts[tsIdx]) {
        const timestampMs = parseInt(rowParts[tsIdx], 10);
        if (!isNaN(timestampMs) && timestampMs > 0) {
          timestamp = new Date(timestampMs).toISOString();
        }
      }
      
      const geofenceCenter = (process.env.GEOFENCE_CENTER || '33.7933,-117.8517').split(',').map(parseFloat);
      const geofenceRadius = parseFloat(process.env.GEOFENCE_RADIUS || '0.25') * 1609.344;
      
      const distance = getDistance(latitude, longitude, geofenceCenter[0], geofenceCenter[1]);
      
      if (distance > geofenceRadius) {
        latitude = 0;
        longitude = 0;
      }
      
      const header = 'location|latitude,location|longitude,updated_at\n';
      const row = `${latitude},${longitude},${timestamp}\n`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.status(200).send(header + row);
    } else {
      res.status(400).json({ error: 'Invalid CSV format' });
    }
  } else {
    res.status(404).json({ error: 'Coordinates not available' });
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}
