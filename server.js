const express = require('express');
const crypto = require('crypto');
const https = require('https');
const app = express();

app.use(express.json());

// CONFIGURATION - CHANGE THESE
const ADMIN_PASSWORD = "qwertyuiopasdfghjklzxcvbnm11111!!!!"; 
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1484692519395790888/AdTAFr8hH3gx9j_06-yw7pXPkY70LyVa6BQpT2BsX4Sw7hDr71exTdLhGx7xNYyexKMa"; 

// DATABASE (Temporary - resets on server restart)
const db = {
    keys: {}
};

// 1. HEALTH CHECK (Prevents "Cannot GET /" error)
app.get('/', (req, res) => {
    res.status(200).send('Obscura Auth API: Online and Functional');
});

// 2. ADMIN GENERATION (Logs to Discord)
app.get('/generate', (req, res) => {
    const auth = req.query.admin_key;

    if (auth !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const newKey = `OBS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    db.keys[newKey] = {
        hwid: null,
        status: "unused",
        created: new Date().toISOString()
    };

    // SEND TO DISCORD
    const discordData = JSON.stringify({
        embeds: [{
            title: "🔑 New Key Generated",
            color: 10714367, // Obscura Purple
            fields: [
                { name: "Key", value: `\`${newKey}\``, inline: true },
                { name: "Type", value: "Premium Lifetime", inline: true }
            ],
            footer: { text: "Obscura Logs" },
            timestamp: new Date()
        }]
    });

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };

    const request = https.request(DISCORD_WEBHOOK_URL, options);
    request.write(discordData);
    request.end();

    res.json({ success: true, key: newKey });
});

// 3. CLIENT VERIFICATION (HWID Locking)
app.post('/verify', (req, res) => {
    const { key, hwid } = req.body;
    const data = db.keys[key];

    if (!data) {
        return res.status(401).json({ success: false, message: "Invalid Key" });
    }

    // Bind HWID on first use
    if (data.hwid === null) {
        data.hwid = hwid;
        data.status = "active";
        return res.json({ success: true, message: "Key bound to device" });
    }

    // Check if HWID matches bound ID
    if (data.hwid !== hwid) {
        return res.status(403).json({ success: false, message: "HWID Mismatch: Key is locked" });
    }

    res.json({ success: true, message: "Authorized" });
});

// 4. HWID RESET (Admin Only)
app.get('/reset', (req, res) => {
    const { admin_key, key } = req.query;

    if (admin_key !== ADMIN_PASSWORD) return res.status(403).send("Denied");
    if (!db.keys[key]) return res.status(404).send("Key not found");

    db.keys[key].hwid = null;
    res.json({ success: true, message: "HWID Reset Successfully" });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Obscura Server running on port ${PORT}`);
});
