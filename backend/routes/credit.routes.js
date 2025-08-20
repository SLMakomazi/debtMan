const express = require('express');
const { param, query } = require('express-validator');
const creditController = require('../controllers/credit.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get current credit score
router.get('/scores/:id', [
  param('id').isUUID().withMessage('Invalid user ID format'),
], creditController.getCreditScore);

// Get credit score history
router.get('/scores/:id/history', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  query('limit').optional().isInt({ min: 1, max: 24 }).withMessage('Limit must be between 1 and 24'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive number'),
], creditController.getCreditScoreHistory);

// Get credit score factors
router.get('/scores/:id/factors', [
  param('id').isUUID().withMessage('Invalid user ID format'),
], creditController.getCreditScoreFactors);

// Request a full credit report
router.post('/reports/:id/request', [
  param('id').isUUID().withMessage('Invalid user ID format'),
], creditController.requestFullCreditReport);

// Get credit report status
router.get('/reports/:id/status/:reportId', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  param('reportId').notEmpty().withMessage('Report ID is required'),
], creditController.getCreditReportStatus);

module.exports = router;
