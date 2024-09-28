const fs = require('fs');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');

const upload = multer({ dest: 'uploads/' });
const csvDirectory = path.join(__dirname, 'uploads');

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

module.exports = (req, res) => {
    upload.single('csv')(req, res, (err) => {
        if (err) {
            return res.status(500).send('Upload error');
        }

        if (req.file && req.file.mimetype === 'text/csv') {
            const filePath = path.join(csvDirectory, req.file.filename);

            const intervalId = setInterval(() => {
                processCSV(filePath);

                clearInterval(intervalId);
            }, 100);

            res.status(200).send('CSV uploaded and processing started');
        } else {
            res.status(400).send('Please upload a valid CSV file');
        }
    });
};
