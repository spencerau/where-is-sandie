const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Use the /tmp directory in Vercel
const csvDirectory = '/tmp/uploads';

if (!fs.existsSync(csvDirectory)) {
    fs.mkdirSync(csvDirectory, { recursive: true });
}

function processCSV(filePath) {
    const results = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            results.push(data);
        })
        .on('end', () => {
            console.log('Parsed CSV Data:', results);

            results.forEach((row, index) => {
                console.log(`Row ${index + 1}:`, row);
            });

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
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const file = req.files?.csv; // Access the uploaded file

    if (!file || file.mimetype !== 'text/csv') {
        return res.status(400).send('Please upload a valid CSV file');
    }

    const filePath = path.join(csvDirectory, file.name);

    // Save the uploaded file to the /tmp directory
    fs.writeFileSync(filePath, file.data);

    const intervalId = setInterval(() => {
        processCSV(filePath);
        clearInterval(intervalId);
    }, 100);

    res.status(200).send('CSV uploaded and processing started');
};