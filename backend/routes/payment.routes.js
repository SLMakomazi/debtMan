const express = require('express');
const { protect } = require('../middleware/auth');
const { getPayments, getPaymentStats } = require('../controllers/payment.controller');

const router = express.Router();

// Protect all routes with authentication
router.use(protect);

// GET /api/v1/payments - Get all payments for user's accounts
router.get('/', getPayments);

// GET /api/v1/payments/stats - Get payment statistics
router.get('/stats', getPaymentStats);

module.exports = router;
