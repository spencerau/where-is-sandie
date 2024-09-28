const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Set up multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Define the directory for saving CSVs (you can change it if needed)
const csvDirectory = path.join(__dirname, 'uploads');

// Create the directory if it doesn't exist
if (!fs.existsSync(csvDirectory)) {
    fs.mkdirSync(csvDirectory, { recursive: true });
}

// Function to handle CSV processing (you can modify as needed)
function processCSV(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
        } else {
            console.log('CSV Data:', data);
            // Add your CSV processing logic here
        }
    });
}

// Main handler for the API endpoint
module.exports = (req, res) => {
    upload.single('csv')(req, res, (err) => {
        if (err) {
            return res.status(500).send('Upload error');
        }

        // Check if the file exists and is a CSV
        if (req.file && req.file.mimetype === 'text/csv') {
            const filePath = path.join(csvDirectory, req.file.filename);

            // Process CSV every 100ms
            setInterval(() => {
                processCSV(filePath);
            }, 100);

            res.status(200).send('CSV uploaded and processing started');
        } else {
            res.status(400).send('Please upload a valid CSV file');
        }
    });
};
