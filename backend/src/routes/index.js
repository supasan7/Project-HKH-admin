const { Router } = require('express');
const { authenticate } = require('../middleware/auth');

const authRoutes = require('./authRoutes');
const roomRoutes = require('./roomRoutes');
const bookingRoutes = require('./bookingRoutes');
const transactionRoutes = require('./transactionRoutes');
const reportRoutes = require('./reportRoutes');

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes (require JWT)
router.use('/rooms', authenticate, roomRoutes);
router.use('/bookings', authenticate, bookingRoutes);
router.use('/transactions', authenticate, transactionRoutes);
router.use('/reports', authenticate, reportRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
