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

// Create a new account
exports.createAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      accountType,
      accountNumber,
      accountName,
      institution,
      balance = 0,
      currency = 'ZAR',
    } = req.body;

    const userId = req.params.id || req.user.id;

    // Only allow users to create accounts for themselves or admins
    if (userId !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to create accounts for this user', 403)
      );
    }

    // Check if account number already exists for this user
    const [existingAccount] = await query(
      'SELECT id FROM accounts WHERE account_number = ? AND user_id = ?',
      [accountNumber, userId]
    );

    if (existingAccount) {
      return next(
        new AppError('An account with this number already exists for this user', 400)
      );
    }

    // Create the account
    const accountId = uuidv4();
    await query(
      `INSERT INTO accounts 
       (id, user_id, account_type, account_number, account_name, institution, balance, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        accountId,
        userId,
        accountType,
        accountNumber,
        accountName,
        institution,
        balance,
        currency,
      ]
    );

    // Get the newly created account
    const [newAccount] = await query('SELECT * FROM accounts WHERE id = ?', [accountId]);

    logger.info(`New account created: ${accountNumber} for user ${userId}`);

    res.status(201).json({
      status: 'success',
      data: {
        account: newAccount,
      },
    });
  } catch (error) {
    logger.error('Error in createAccount:', error);
    next(error);
  }
};

// Get all accounts for a user
exports.getAccounts = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;
    const { includeInactive = 'false' } = req.query;

    // Only allow users to view their own accounts or admins
    if (userId !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view these accounts', 403)
      );
    }

    let queryStr = 'SELECT * FROM accounts WHERE user_id = ?';
    const queryParams = [userId];

    if (includeInactive !== 'true') {
      queryStr += ' AND is_active = TRUE';
    }

    const accounts = await query(queryStr, queryParams);

    res.status(200).json({
      status: 'success',
      results: accounts.length,
      data: {
        accounts,
      },
    });
  } catch (error) {
    logger.error('Error in getAccounts:', error);
    next(error);
  }
};

// Get a single account
exports.getAccount = async (req, res, next) => {
  try {
    const { id, accountId } = req.params;

    // Get the account with the user ID to verify ownership
    const [account] = await query(
      'SELECT * FROM accounts WHERE id = ?',
      [accountId]
    );

    if (!account) {
      return next(new AppError('No account found with that ID', 404));
    }

    // Only allow users to view their own accounts or admins
    if (account.user_id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view this account', 403)
      );
    }

    // Get account transactions
    const transactions = await query(
      'SELECT * FROM transactions WHERE account_id = ? ORDER BY transaction_date DESC LIMIT 10',
      [accountId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        account: {
          ...account,
          recentTransactions: transactions,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getAccount:', error);
    next(error);
  }
};

// Update an account
exports.updateAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountId } = req.params;
    const updates = req.body;

    // Get the account to verify ownership
    const [account] = await query('SELECT * FROM accounts WHERE id = ?', [accountId]);

    if (!account) {
      return next(new AppError('No account found with that ID', 404));
    }

    // Only allow users to update their own accounts or admins
    if (account.user_id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to update this account', 403)
      );
    }

    // Remove restricted fields that shouldn't be updated
    const restrictedFields = [
      'id',
      'user_id',
      'created_at',
      'updated_at',
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
    const values = [...Object.values(updates), accountId];

    await query(
      `UPDATE accounts SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Get the updated account
    const [updatedAccount] = await query('SELECT * FROM accounts WHERE id = ?', [accountId]);

    logger.info(`Account updated: ${accountId}`);

    res.status(200).json({
      status: 'success',
      data: {
        account: updatedAccount,
      },
    });
  } catch (error) {
    logger.error('Error in updateAccount:', error);
    next(error);
  }
};

// Delete an account (soft delete)
exports.deleteAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    // Get the account to verify ownership
    const [account] = await query('SELECT * FROM accounts WHERE id = ?', [accountId]);

    if (!account) {
      return next(new AppError('No account found with that ID', 404));
    }

    // Only allow users to delete their own accounts or admins
    if (account.user_id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to delete this account', 403)
      );
    }

    // Soft delete the account
    await query(
      'UPDATE accounts SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [accountId]
    );

    logger.info(`Account deleted: ${accountId}`);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    logger.error('Error in deleteAccount:', error);
    next(error);
  }
};

// Create a new transaction
exports.createTransaction = async (req, res, next) => {
  const transaction = await pool.getConnection();
  try {
    await transaction.beginTransaction();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountId } = req.params;
    const {
      transactionType,
      amount,
      description,
      reference,
      category,
      transactionDate = new Date(),
    } = req.body;

    // Get the account to verify ownership and get current balance
    const [account] = await transaction.query(
      'SELECT * FROM accounts WHERE id = ? FOR UPDATE',
      [accountId]
    );

    if (!account || account.length === 0) {
      await transaction.rollback();
      return next(new AppError('No account found with that ID', 404));
    }

    // Only allow users to create transactions for their own accounts or admins
    if (account[0].user_id !== req.user.id && !req.user.is_admin) {
      await transaction.rollback();
      return next(
        new AppError('You are not authorized to create transactions for this account', 403)
      );
    }

    // Calculate new balance
    let newBalance = parseFloat(account[0].balance);
    if (transactionType === 'debit') {
      if (newBalance < amount) {
        await transaction.rollback();
        return next(new AppError('Insufficient funds', 400));
      }
      newBalance -= parseFloat(amount);
    } else {
      newBalance += parseFloat(amount);
    }

    // Create the transaction
    const transactionId = uuidv4();
    await transaction.query(
      `INSERT INTO transactions 
       (id, account_id, user_id, transaction_type, amount, description, reference, category, transaction_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [
        transactionId,
        accountId,
        account[0].user_id,
        transactionType,
        amount,
        description,
        reference,
        category,
        transactionDate,
      ]
    );

    // Update the account balance
    await transaction.query(
      'UPDATE accounts SET balance = ?, updated_at = NOW() WHERE id = ?',
      [newBalance, accountId]
    );

    await transaction.commit();

    // Get the created transaction
    const [newTransaction] = await query(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );

    logger.info(`Transaction created: ${transactionId} for account ${accountId}`);

    res.status(201).json({
      status: 'success',
      data: {
        transaction: newTransaction,
      },
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error in createTransaction:', error);
    next(error);
  } finally {
    if (transaction) await transaction.release();
  }
};

// Get transactions for an account
exports.getTransactions = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const {
      startDate,
      endDate,
      type,
      category,
      minAmount,
      maxAmount,
      limit = 50,
      offset = 0,
    } = req.query;

    // Verify account ownership
    const [account] = await query('SELECT * FROM accounts WHERE id = ?', [accountId]);

    if (!account) {
      return next(new AppError('No account found with that ID', 404));
    }

    // Only allow users to view their own transactions or admins
    if (account.user_id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view these transactions', 403)
      );
    }

    // Build the query
    let queryStr = 'SELECT * FROM transactions WHERE account_id = ?';
    const queryParams = [accountId];

    if (startDate) {
      queryStr += ' AND transaction_date >= ?';
      queryParams.push(new Date(startDate));
    }

    if (endDate) {
      queryStr += ' AND transaction_date <= ?';
      queryParams.push(new Date(endDate));
    }

    if (type) {
      queryStr += ' AND transaction_type = ?';
      queryParams.push(type);
    }

    if (category) {
      queryStr += ' AND category = ?';
      queryParams.push(category);
    }

    if (minAmount) {
      queryStr += ' AND amount >= ?';
      queryParams.push(parseFloat(minAmount));
    }

    if (maxAmount) {
      queryStr += ' AND amount <= ?';
      queryParams.push(parseFloat(maxAmount));
    }

    // Get total count for pagination
    const countQuery = queryStr.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await query(countQuery, queryParams);
    const total = countResult ? countResult.total : 0;

    // Add sorting and pagination
    queryStr += ' ORDER BY transaction_date DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    const transactions = await query(queryStr, queryParams);

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      total,
      data: {
        transactions,
      },
    });
  } catch (error) {
    logger.error('Error in getTransactions:', error);
    next(error);
  }
};
