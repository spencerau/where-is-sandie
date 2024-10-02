const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const multer = require('multer');

const csvDirectory = '/tmp/uploads';

try {
    if (!fs.existsSync(csvDirectory)) {
        fs.mkdirSync(csvDirectory, { recursive: true });
    }
} catch (err) {
    console.error('Error creating upload directory:', err);
}

const upload = multer({
    dest: csvDirectory,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
});

function processCSV(filePath) {
    const results = [];

    try {
        console.log(`Processing CSV at path: ${filePath}`);
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', () => {
                console.log('Parsed CSV Data:', results);

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

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    upload.single('csv')(req, res, (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).send('File size is too large');
            }
            return res.status(500).send('Error uploading file');
        }

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
};
