const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Parse JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'ไม่พบ Endpoint ที่ร้องขอ' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
