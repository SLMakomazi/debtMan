const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const creditRoutes = require('./credit.routes');
const accountRoutes = require('./account.routes');
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/credit', creditRoutes);
router.use('/accounts', accountRoutes);

// Dashboard route (protected)
router.get('/dashboard', protect, getDashboardStats);

// Handle 404
router.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

module.exports = router;
