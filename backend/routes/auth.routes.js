const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Log all auth routes
router.use((req, res, next) => {
  console.log('Auth Route Hit:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Login route with detailed logging
router.post('/login', async (req, res, next) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    await authController.login(req, res, next);
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// Input validation middleware
const validateSignup = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  body('phoneNumber')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('idNumber')
    .matches(/^[0-9]{13}$/)
    .withMessage('Please provide a valid 13-digit ID number'),
  body('dateOfBirth').isDate().withMessage('Please provide a valid date of birth'),
  body('address').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('postalCode').notEmpty().withMessage('Postal code is required'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const validateForgotPassword = [
  body('email').isEmail().withMessage('Please provide a valid email'),
];

const validateResetPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  body('passwordConfirm')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

// Routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.patch('/reset-password/:token', validateResetPassword, authController.resetPassword);

// Protected routes (require authentication)
router.use(protect);

router.get('/me', authController.getMe);
router.patch('/update-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  ...validateResetPassword,
], authController.updatePassword);

module.exports = router;
