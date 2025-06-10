const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'default-secret-key';

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.text({ type: '*/*', limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'client/build')));

// Ensure dbs directory exists
const dbsDir = path.join(__dirname, 'dbs');
if (!fs.existsSync(dbsDir)) {
    fs.mkdirSync(dbsDir);
}

// Root redirect to new UUID
app.get('/', (req, res) => {
    const newUuid = uuidv4();
    res.redirect(301, `/${newUuid}`);
});

// Validate bearer token
function validateBearer(bearer, uuid) {
    try {
        const decrypted = crypto.AES.decrypt(bearer, SECRET_KEY).toString(crypto.enc.Utf8);
        return decrypted === uuid;
    } catch (error) {
        return false;
    }
}

// Get database for UUID
function getDatabase(uuid) {
    const dbPath = path.join(dbsDir, `${uuid}.db`);
    const db = new sqlite3.Database(dbPath);
    
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created DATETIME DEFAULT CURRENT_TIMESTAMP,
            content TEXT
        )`);
    });
    
    return db;
}

// Check if string is a valid UUID
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Check if UUID database exists and validate bearer ownership
app.get('/:uuid/status', (req, res) => {
    const { uuid } = req.params;
    if (!isValidUUID(uuid)) {
        return res.status(400).json({ error: 'Invalid UUID format' });
    }
    
    const dbPath = path.join(dbsDir, `${uuid}.db`);
    const exists = fs.existsSync(dbPath);
    
    // If bearer is provided, validate it
    const bearer = req.headers.authorization?.replace('Bearer ', '') || req.headers.authorization;
    const isOwner = bearer ? validateBearer(bearer, uuid) : false;
    
    res.json({ 
        exists, 
        isOwner,
        canGenerateBearer: !exists 
    });
});

// Generate bearer token for UUID owner (only if database doesn't exist)
app.post('/:uuid/bearer', (req, res) => {
    const { uuid } = req.params;
    if (!isValidUUID(uuid)) {
        return res.status(400).json({ error: 'Invalid UUID format' });
    }
    
    // Check if database already exists - if so, deny bearer generation
    const dbPath = path.join(dbsDir, `${uuid}.db`);
    if (fs.existsSync(dbPath)) {
        return res.status(403).json({ error: 'Bearer token can only be generated for new UUIDs' });
    }
    
    const bearer = crypto.AES.encrypt(uuid, SECRET_KEY).toString();
    res.json({ bearer });
});

// Handle UUID routes - GET serves React app, POST accepts content, DELETE removes data
app.route('/:uuid')
    .get((req, res) => {
        const { uuid } = req.params;
        if (!isValidUUID(uuid)) {
            return res.sendFile(path.join(__dirname, 'client/build/index.html'));
        }
        // Serve React app for valid UUIDs
        res.sendFile(path.join(__dirname, 'client/build/index.html'));
    })
    .post((req, res) => {
        const { uuid } = req.params;
        if (!isValidUUID(uuid)) {
            return res.status(400).json({ error: 'Invalid UUID format' });
        }
        
        const bearer = req.headers.authorization?.replace('Bearer ', '') || req.headers.authorization;
        
        // Ensure content is always stored as string
        let content;
        if (typeof req.body === 'string') {
            content = req.body;
        } else if (typeof req.body === 'object' && req.body !== null) {
            content = JSON.stringify(req.body);
        } else {
            content = String(req.body);
        }
        
        if (!bearer || !validateBearer(bearer, uuid)) {
            return res.status(401).json({ error: 'Invalid or missing bearer token' });
        }
        
        const db = getDatabase(uuid);
        
        db.run('INSERT INTO content (content) VALUES (?)', [content], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ id: this.lastID, created: new Date().toISOString(), content });
        });
        
        db.close();
    })
    .delete((req, res) => {
        const { uuid } = req.params;
        if (!isValidUUID(uuid)) {
            return res.status(400).json({ error: 'Invalid UUID format' });
        }
        
        const bearer = req.headers.authorization?.replace('Bearer ', '') || req.headers.authorization;
        
        if (!bearer || !validateBearer(bearer, uuid)) {
            return res.status(401).json({ error: 'Invalid or missing bearer token' });
        }
        
        const dbPath = path.join(dbsDir, `${uuid}.db`);
        
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }
        
        res.json({ success: true });
    });

// Get content for UUID page (separate endpoint for API calls)
app.get('/:uuid/content', (req, res) => {
    const { uuid } = req.params;
    if (!isValidUUID(uuid)) {
        return res.status(400).json({ error: 'Invalid UUID format' });
    }
    
    const dbPath = path.join(dbsDir, `${uuid}.db`);
    
    if (!fs.existsSync(dbPath)) {
        return res.json({ content: [] });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    db.all('SELECT * FROM content ORDER BY created DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ content: rows });
    });
    
    db.close();
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});