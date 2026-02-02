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

  const csvPath = path.join('/tmp', 'coordinates.csv');
  const metaPath = path.join('/tmp', 'location_meta.json');

  if (fs.existsSync(csvPath)) {
    let csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split(/\r?\n/).filter((l) => l.trim() !== '');
    
    if (lines.length >= 2) {
      const headers = lines[0].split(',');
      const rowParts = lines[1].split(',');
      
      const latIdx = headers.findIndex((h) => h.includes('latitude'));
      const lonIdx = headers.findIndex((h) => h.includes('longitude'));
      const tsIdx = headers.findIndex((h) => h.includes('timeStamp'));
      
      let latitude = latIdx >= 0 ? parseFloat(rowParts[latIdx]) : 0;
      let longitude = lonIdx >= 0 ? parseFloat(rowParts[lonIdx]) : 0;
      const findMyTimestamp = tsIdx >= 0 && rowParts[tsIdx] ? new Date(parseInt(rowParts[tsIdx])).toISOString() : new Date().toISOString();
      
      const geofenceCenter = (process.env.GEOFENCE_CENTER || '33.7933,-117.8517').split(',').map(parseFloat);
      const geofenceRadius = parseFloat(process.env.GEOFENCE_RADIUS || '0.25') * 1609.344; // miles to meters
      
      const distance = getDistance(latitude, longitude, geofenceCenter[0], geofenceCenter[1]);
      
      if (distance > geofenceRadius) {
        latitude = 0;
        longitude = 0;
      }
      
      // Track location changes
      let timestamp = findMyTimestamp;
      let meta = { lastLat: null, lastLon: null, lastChanged: findMyTimestamp };
      
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        } catch (e) {}
      }
      
      // If location changed, update timestamp to FindMy's timestamp
      if (meta.lastLat !== latitude || meta.lastLon !== longitude) {
        meta.lastLat = latitude;
        meta.lastLon = longitude;
        meta.lastChanged = findMyTimestamp;
        fs.writeFileSync(metaPath, JSON.stringify(meta));
      } else {
        timestamp = meta.lastChanged;
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
