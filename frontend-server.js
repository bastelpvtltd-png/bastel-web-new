// frontend-server.js — tiny static file server for local dev
const path = require('path');
const express = require(path.join(__dirname, 'backend', 'node_modules', 'express'));

const app = express();
const PORT = 5500;

app.use(express.static(path.join(__dirname, 'frontend')));

app.listen(PORT, () => console.log(`Bastel frontend running at http://localhost:${PORT}`));
