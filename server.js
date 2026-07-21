const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function startServer(dataDir) {
    // If dataDir is provided, use it. Otherwise default to __dirname
    const finalDataDir = dataDir || __dirname;
    const DB_FILE = path.join(finalDataDir, 'db.json');
    console.log('Database location:', DB_FILE);

    // Initial DB Setup
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ items: [], transactions: [] }, null, 2));
    }

    const server = http.createServer((req, res) => {
        // ... (request handling logic updates to use DB_FILE from closure)
        // We need to move the request handler inside this function or pass DB_FILE to it
        // To avoid massive refactor, let's keep DB_FILE scope in mind.
        // Actually, let's just make DB_FILE a module-level variable that gets updated? 
        // No, purely functional is better, but requires moving the whole server creation inside.

        handleRequest(req, res, DB_FILE);
    });

    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/`);
    });

    return server;
}

// Extract request handler to keep code clean and accessible
function handleRequest(req, res, dbFilePath) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Get all data
    if (req.url === '/api/data' && req.method === 'GET') {
        fs.readFile(dbFilePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to read database' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // API: Sync data (Receive updates)
    if (req.url === '/api/sync' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const operation = JSON.parse(body);
                // READ from dbFilePath
                const db = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));

                // Handle Operation
                if (operation.collection === 'items') {
                    if (operation.type === 'create') {
                        const idx = db.items.findIndex(i => i.id === operation.data.id);
                        if (idx === -1) {
                            db.items.push(operation.data);
                        } else {
                            db.items[idx] = operation.data;
                        }
                    } else if (operation.type === 'update') {
                        const idx = db.items.findIndex(i => i.id === operation.data.id);
                        if (idx !== -1) {
                            db.items[idx] = operation.data;
                        } else {
                            db.items.push(operation.data);
                        }
                    } else if (operation.type === 'delete') {
                        db.items = db.items.filter(i => i.id !== operation.data.id);
                    }
                } else if (operation.collection === 'transactions') {
                    const idx = db.transactions.findIndex(t => t.id === operation.data.id);
                    if (idx === -1) {
                        db.transactions.push(operation.data);
                    }
                }

                fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                console.error('Sync error:', e);
                res.writeHead(500);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Static File Serving
    let filePath = '.' + req.url.split('?')[0];
    if (filePath === './') {
        filePath = './index.html';
    }

    // Fix for serving files when running inside Electron or different CWD
    // We should resolve relative to __dirname (where server.js is)
    // But verify if we are running in electron-main context where __dirname is correct
    const absoluteFilePath = path.join(__dirname, filePath);

    const extname = String(path.extname(absoluteFilePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(absoluteFilePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                if (!absoluteFilePath.endsWith('.html') && !absoluteFilePath.endsWith('.js') && !absoluteFilePath.endsWith('.css')) {
                    // Try extension... (omitted for brevity, assume simple serving for now or keep logic)
                    // Replicating logic for brevity in this thought trace, but in actual code I'll copy.
                    const htmlPath = absoluteFilePath + '.html';
                    if (fs.existsSync(htmlPath)) {
                        fs.readFile(htmlPath, (err, content) => {
                            if (err) { res.writeHead(404); res.end('File not found'); }
                            else { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(content, 'utf-8'); }
                        });
                        return;
                    }
                }
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

// Allow standalone run
if (require.main === module) {
    const dataDir = process.argv[2] || __dirname;
    startServer(dataDir);
}

module.exports = { startServer };
