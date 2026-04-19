// server.js - Main Express Server Entry Point

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────
app.use(cors()); // Allow cross-origin requests from frontend
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ─────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/schedule', require('./routes/schedule'));

// ─────────────────────────────────────────
// SERVE FRONTEND PAGES
// ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

app.get('/add-task', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/add-task.html'));
});

app.get('/schedule', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/schedule.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Study Planner running at http://localhost:${PORT}`);
  console.log(`📚 Open your browser and go to http://localhost:${PORT}\n`);
});
