const express = require('express');
const { body, param, query } = require('express-validator');
const accountController = require('../controllers/account.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Account routes
router.post('/:id/accounts', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  body('accountType').isIn(['savings', 'cheque', 'credit_card', 'loan', 'other']).withMessage('Invalid account type'),
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('accountName').notEmpty().withMessage('Account name is required'),
  body('institution').notEmpty().withMessage('Institution name is required'),
  body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
], accountController.createAccount);

router.get('/:id/accounts', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  query('includeInactive').optional().isIn(['true', 'false']).withMessage('includeInactive must be true or false'),
], accountController.getAccounts);

router.get('/:id/accounts/:accountId', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  param('accountId').isUUID().withMessage('Invalid account ID format'),
], accountController.getAccount);

router.patch('/:id/accounts/:accountId', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  param('accountId').isUUID().withMessage('Invalid account ID format'),
  body('accountType').optional().isIn(['savings', 'cheque', 'credit_card', 'loan', 'other']).withMessage('Invalid account type'),
  body('accountName').optional().notEmpty().withMessage('Account name cannot be empty'),
  body('institution').optional().notEmpty().withMessage('Institution name cannot be empty'),
  body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
], accountController.updateAccount);

router.delete('/:id/accounts/:accountId', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  param('accountId').isUUID().withMessage('Invalid account ID format'),
], accountController.deleteAccount);

// Transaction routes
router.post('/:id/accounts/:accountId/transactions', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  param('accountId').isUUID().withMessage('Invalid account ID format'),
  body('transactionType').isIn(['debit', 'credit']).withMessage('Transaction type must be either debit or credit'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('description').optional().isString().trim().notEmpty().withMessage('Description cannot be empty'),
  body('reference').optional().isString().trim().notEmpty().withMessage('Reference cannot be empty'),
  body('category').optional().isString().trim().notEmpty().withMessage('Category cannot be empty'),
  body('transactionDate').optional().isISO8601().withMessage('Invalid date format. Use ISO 8601 format (e.g., YYYY-MM-DD)'),
], accountController.createTransaction);

router.get('/:id/accounts/:accountId/transactions', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  param('accountId').isUUID().withMessage('Invalid account ID format'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date in ISO 8601 format'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date in ISO 8601 format'),
  query('type').optional().isIn(['debit', 'credit']).withMessage('Type must be either debit or credit'),
  query('category').optional().isString().trim().notEmpty().withMessage('Category cannot be empty'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive number'),
], accountController.getTransactions);

module.exports = router;
