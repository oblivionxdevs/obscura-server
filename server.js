const express = require('express');
const crypto = require('crypto');
const app = express();
const ADMIN_PASSWORD = "qwertyuiopasdfghjklzxcvbnm11111!!!!";
app.use(express.json());

const db = {
    keys: {} 
};

app.get('/', (req, res) => {
    res.send('Obscura Auth Server is Online');
});



app.get('/generate', (req, res) => {
    const auth = req.query.admin_key;

    if (auth !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const newKey = `OBS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    db.keys[newKey] = { hwid: null, status: "unused" };
    res.json({ success: true, key: newKey });
});

app.post('/verify', (req, res) => {
    const { key, hwid } = req.body;
    const keyData = db.keys[key];

    if (!keyData) {
        return res.status(401).json({ success: false, message: "Invalid Key" });
    }

    if (keyData.hwid === null) {
        keyData.hwid = hwid;
        keyData.status = "active";
        return res.json({ success: true, message: "Key bound to this device." });
    }

    if (keyData.hwid !== hwid) {
        return res.status(403).json({ success: false, message: "HWID Mismatch. Key is locked to another PC." });
    }

    res.json({ success: true, message: "Access Granted" });
});

app.listen(3000, () => console.log('Auth Server Active'));
