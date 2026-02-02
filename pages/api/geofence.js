// pages/api/geofence.js

export default function handler(req, res) {
  const centerRaw = process.env.GEOFENCE_CENTER || '';
  const radiusRaw = process.env.GEOFENCE_RADIUS || '0.25'; // miles

  const parts = centerRaw.split(',').map((p) => p.trim());
  if (parts.length !== 2) {
    res.status(400).json({ error: 'GEOFENCE_CENTER not configured' });
    return;
  }

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  const radiusMiles = parseFloat(radiusRaw) || 0.25;
  const radiusMeters = radiusMiles * 1609.344;

  res.status(200).json({ center: { lat, lng }, radius_m: radiusMeters });
}
