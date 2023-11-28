require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');  // Import the path module
const app = express();

const PORT = process.env.PORT || 3000;

// Serve the static files (HTML, CSS, client-side JS)
app.use(express.static('public'));

// Endpoint to get the Google Maps API key
app.get('/api/maps-key', (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

// Route to get the coordinates
app.get('/api/coordinates', (req, res) => {
    const filePath = path.join(__dirname, 'coordinates.txt');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading the coordinates file');
            return;
        }
        res.send(data);
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle a request to display a map with markers
app.get('/display-map', (req, res) => {
    // You can retrieve additional data or parameters from the request
    const { lat, lng } = req.query;

    // Render an HTML page with a map using a template engine (e.g., EJS)
    res.render('map', { lat, lng });
});

