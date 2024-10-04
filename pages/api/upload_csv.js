// pages/api/upload_csv.js

import multer from 'multer';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = multer.memoryStorage();
const upload = multer({ storage });


function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}


export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // allow requests from any origins
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      await runMiddleware(req, res, upload.single('file'));

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileName = 'coordinates.csv';
      const targetPath = path.join('/tmp', fileName);

      fs.writeFileSync(targetPath, req.file.buffer);

      return res.status(200).json({ message: 'CSV file uploaded successfully' });
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      return res.status(500).json({ error: 'Error processing uploaded file' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
