// pages/api/get_coordinates.js

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const csvPath = path.join('/tmp', 'coordinates.csv');

  if (fs.existsSync(csvPath)) {
    const csvData = fs.readFileSync(csvPath, 'utf8');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csvData);
  } else {
    res.status(404).json({ error: 'Coordinates not available' });
  }
}
