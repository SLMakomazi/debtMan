const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Helper function to handle database queries
const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Get all users (admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await query(
      'SELECT id, first_name, last_name, email, phone_number, id_number, is_verified, is_admin, created_at FROM users'
    );

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    logger.error('Error in getAllUsers:', error);
    next(error);
  }
};

// Get user by ID
exports.getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [user] = await query(
      'SELECT id, first_name, last_name, email, phone_number, id_number, date_of_birth, address, city, postal_code, country, credit_score, credit_score_updated_at, is_verified, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    // Only allow admins or the user themselves to access the profile
    if (user.id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view this profile', 403)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Error in getUser:', error);
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Only allow users to update their own profile or admins to update any profile
    if (id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to update this profile', 403)
      );
    }

    // Remove restricted fields that shouldn't be updated here
    const restrictedFields = [
      'id',
      'password',
      'is_verified',
      'is_admin',
      'created_at',
      'credit_score',
      'credit_score_updated_at',
    ];

    Object.keys(updates).forEach((key) => {
      if (restrictedFields.includes(key)) {
        delete updates[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields to update', 400));
    }

    // Build the update query
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), id];

    await query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Get the updated user
    const [updatedUser] = await query(
      'SELECT id, first_name, last_name, email, phone_number, id_number, date_of_birth, address, city, postal_code, country, credit_score, credit_score_updated_at, is_verified, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    logger.error('Error in updateProfile:', error);
    next(error);
  }
};

// Delete user (mark as inactive)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only allow admins to delete users
    if (!req.user.is_admin) {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }

    // Don't allow deleting your own account
    if (id === req.user.id) {
      return next(new AppError('You cannot delete your own account', 400));
    }

    // Soft delete by marking as inactive
    await query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?', [id]);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    logger.error('Error in deleteUser:', error);
    next(error);
  }
};

// Get user's credit score
exports.getCreditScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only allow users to view their own credit score or admins
    if (id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view this credit score', 403)
      );
    }

    const [creditScore] = await query(
      'SELECT score, score_type, report_date, factors FROM credit_score_history WHERE user_id = ? ORDER BY report_date DESC LIMIT 1',
      [id]
    );

    if (!creditScore) {
      return next(new AppError('No credit score found for this user', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        creditScore,
      },
    });
  } catch (error) {
    logger.error('Error in getCreditScore:', error);
    next(error);
  }
};

// Get user's accounts
exports.getUserAccounts = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only allow users to view their own accounts or admins
    if (id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view these accounts', 403)
      );
    }

    const accounts = await query(
      'SELECT * FROM accounts WHERE user_id = ? AND is_active = TRUE',
      [id]
    );

    res.status(200).json({
      status: 'success',
      results: accounts.length,
      data: {
        accounts,
      },
    });
  } catch (error) {
    logger.error('Error in getUserAccounts:', error);
    next(error);
  }
};

// Get user's transactions
exports.getUserTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    // Only allow users to view their own transactions or admins
    if (id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view these transactions', 403)
      );
    }

    // Get total count for pagination
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
      [id]
    );
    const total = countResult ? countResult.total : 0;

    // Get paginated transactions
    const transactions = await query(
      `SELECT t.*, a.account_name, a.account_number, a.institution 
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE t.user_id = ? 
       ORDER BY t.transaction_date DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      total,
      data: {
        transactions,
      },
    });
  } catch (error) {
    logger.error('Error in getUserTransactions:', error);
    next(error);
  }
};
