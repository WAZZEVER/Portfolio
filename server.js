const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// --- PUBLIC ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/projects', (req, res) => res.sendFile(path.join(__dirname, 'public', 'projects.html')));
app.get('/project', (req, res) => res.sendFile(path.join(__dirname, 'public', 'project.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/marketplace', (req, res) => res.sendFile(path.join(__dirname, 'public', 'marketplace.html')));

// --- ADMIN ROUTES ---
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin/login.html')));
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin/dashboard.html')));
app.get('/admin/editor', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin/editor.html')));

app.listen(PORT, () => {
    console.log(`🚀 Wazzever server running at http://localhost:${PORT}`);
});