require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const csvDirectory = '/tmp/uploads';
let latestCoordinates = { latitude: null, longitude: null };

try {
    if (!fs.existsSync(csvDirectory)) {
        fs.mkdirSync(csvDirectory, { recursive: true });
    }
} catch (err) {
    console.error('Error creating upload directory:', err);
}

const upload = multer({
    dest: csvDirectory,
    limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(express.static('public'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.get('/api/maps-key', (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

app.get('/api/coordinates', (req, res) => {
    if (latestCoordinates.latitude && latestCoordinates.longitude) {
        res.json(latestCoordinates);
    } else {
        res.status(404).send('No coordinates available');
    }
});

app.post('/api/update', upload.single('csv'), (req, res) => {
    const file = req.file;
    if (!file) {
        console.error('No file uploaded');
        return res.status(400).send('No file uploaded');
    }

    const originalFilename = file.originalname || '';
    const filePath = file.path;

    console.log('Uploaded file details:', file);
    console.log(`Original filename: ${originalFilename}`);
    console.log(`File extension: ${path.extname(originalFilename).toLowerCase()}`);

    if (!originalFilename.toLowerCase().endsWith('.csv')) {
        console.error('Invalid file type:', originalFilename);
        return res.status(400).send('Please upload a valid CSV file');
    }

    try {
        processCSV(filePath);
        res.status(200).send('CSV uploaded and processing started');
    } catch (processingError) {
        console.error('Error processing file:', processingError);
        res.status(500).send('A server error has occurred while processing the file');
    }
});

function processCSV(filePath) {
    try {
        console.log(`Processing CSV at path: ${filePath}`);
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const latitude = data['location|latitude'];
                const longitude = data['location|longitude'];

                if (latitude && longitude) {
                    latestCoordinates = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
                    console.log(`Updated coordinates: ${latestCoordinates.latitude}, ${latestCoordinates.longitude}`);
                }
            })
            .on('end', () => {
                console.log('Finished processing CSV');
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    } else {
                        console.log('File successfully processed and deleted:', filePath);
                    }
                });
            })
            .on('error', (err) => {
                console.error('Error processing CSV file:', err);
            });
    } catch (err) {
        console.error('Error during CSV processing:', err);
    }
}

app.get('/display-map', (req, res) => {
    const { lat, lng } = req.query;
    res.render('map', { lat, lng });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
