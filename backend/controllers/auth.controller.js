const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { createSendToken } = require('../utils/auth');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Helper function to handle database queries
const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Register a new user
exports.signup = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      idNumber,
      dateOfBirth,
      address,
      city,
      postalCode,
    } = req.body;

    // Check if user already exists
    const [existingUser] = await query('SELECT id FROM users WHERE email = ? OR id_number = ?', [email, idNumber]);
    
    if (existingUser) {
      return next(new AppError('User with this email or ID number already exists', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = uuidv4();
    await query(
      `INSERT INTO users (
        id, first_name, last_name, email, password, phone_number, 
        id_number, date_of_birth, address, city, postal_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        firstName,
        lastName,
        email,
        hashedPassword,
        phoneNumber,
        idNumber,
        dateOfBirth,
        address,
        city,
        postalCode,
      ]
    );

    // Get the newly created user
    const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]);

    // Log the registration
    logger.info(`New user registered: ${email}`);

    // Send response with token
    createSendToken(user, 201, res);
  } catch (error) {
    logger.error('Error in signup:', error);
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const [user] = await query('SELECT * FROM users WHERE email = ?', [email]);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) Update last login time
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // 4) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Error in login:', error);
    next(error);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Get user based on POSTed email
    const { email } = req.body;
    const [user] = await query('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return next(new AppError('There is no user with that email address.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3) Save the reset token to the database
    await query(
      'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), user.id, resetToken, resetTokenExpires]
    );

    // 4) Send it to user's email (in a real app, you would send an email)
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    
    // In a real app, you would send an email here
    logger.info(`Password reset token: ${resetToken}\nReset URL: ${resetURL}`);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    logger.error('Error in forgotPassword:', error);
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    if (password !== passwordConfirm) {
      return next(new AppError('Passwords do not match', 400));
    }

    // 2) Get token and check if it's not expired
    const [resetToken] = await query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (!resetToken) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // 3) Update user's password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await query(
      'UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?',
      [hashedPassword, resetToken.user_id]
    );

    // 4) Delete the token
    await query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);

    // 5) Log the user in, send JWT
    const [user] = await query('SELECT * FROM users WHERE id = ?', [
      resetToken.user_id,
    ]);

    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Error in resetPassword:', error);
    next(error);
  }
};

// Update password
exports.updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const userId = req.user.id;
    const { currentPassword, newPassword, passwordConfirm } = req.body;

    if (newPassword !== passwordConfirm) {
      return next(new AppError('New passwords do not match', 400));
    }

    // 2) Check if current password is correct
    const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]);

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return next(new AppError('Your current password is wrong', 401));
    }

    // 3) If so, update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    // 4) Log user in, send JWT
    const [updatedUser] = await query('SELECT * FROM users WHERE id = ?', [
      userId,
    ]);

    createSendToken(updatedUser, 200, res);
  } catch (error) {
    logger.error('Error in updatePassword:', error);
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const [user] = await query('SELECT id, first_name, last_name, email, phone_number, id_number, date_of_birth, address, city, postal_code, country, credit_score, credit_score_updated_at, is_verified, is_admin, created_at, updated_at FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Error in getMe:', error);
    next(error);
  }
};
