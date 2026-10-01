const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Path for storing consent data
const dataFile = path.join(__dirname, 'consent-data.json');

// Helper to safely read data
function readData() {
    if (!fs.existsSync(dataFile)) {
        return [];
    }
    try {
        const content = fs.readFileSync(dataFile, 'utf-8');
        return content ? JSON.parse(content) : [];
    } catch (err) {
        console.error('Error reading consent-data.json:', err);
        return [];
    }
}

// Helper to safely write data
function writeData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/consent - retrieve all consent records
app.get('/api/consent', (req, res) => {
    const data = readData();
    res.json({
        total: data.length,
        data: data
    });
});

// POST /api/consent - save new consent entry
app.post('/api/consent', (req, res) => {
    const { consent1, consent2, consent3 } = req.body;

    // Validate inputs
    if (!consent1 || !consent2 || !consent3) {
        return res.status(400).json({
            error: 'กรุณาเลือกความยินยอมให้ครบทั้ง 3 ข้อ'
        });
    }

    const newEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        consent1,
        consent2,
        consent3
    };

    try {
        const data = readData();
        data.push(newEntry);
        writeData(data);

        return res.status(200).json({
            message: 'บันทึกข้อมูลความยินยอมเรียบร้อยแล้ว',
            entry: newEntry
        });
    } catch (err) {
        console.error('Error saving consent data:', err);
        return res.status(500).json({
            error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะบันทึกข้อมูล'
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Consent Form App Server is running!`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` API Endpoint: http://localhost:${PORT}/api/consent`);
    console.log(`=========================================`);
});
