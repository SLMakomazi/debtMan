const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Admin routes
router.get('/', restrictTo('admin'), userController.getAllUsers);

// User profile routes
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid user ID format'),
], userController.getUser);

router.patch('/:id', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  body('firstName').optional().isString().trim().notEmpty().withMessage('First name is required'),
  body('lastName').optional().isString().trim().notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phoneNumber').optional().matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('address').optional().isString().trim().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().isString().trim().notEmpty().withMessage('City cannot be empty'),
  body('postalCode').optional().isPostalCode('any').withMessage('Please provide a valid postal code'),
], userController.updateProfile);

router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  restrictTo('admin'),
], userController.deleteUser);

// Credit score routes
router.get('/:id/credit-score', [
  param('id').isUUID().withMessage('Invalid user ID format'),
], userController.getCreditScore);

// Account routes
router.get('/:id/accounts', [
  param('id').isUUID().withMessage('Invalid user ID format'),
], userController.getUserAccounts);

// Transaction routes
router.get('/:id/transactions', [
  param('id').isUUID().withMessage('Invalid user ID format'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive number'),
], userController.getUserTransactions);

module.exports = router;
