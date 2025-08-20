const { pool } = require('../config/db');
const AppError = require('../utils/appError');

// Helper function to execute SQL queries
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper to get user's account IDs
const getUserAccountIds = async (userId) => {
  const accounts = await query('SELECT id FROM accounts WHERE user_id = ?', [userId]);
  return accounts.map(account => account.id);
};

exports.getPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const accountIds = await getUserAccountIds(userId);
    
    if (accountIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: []
      });
    }

    const payments = await query(
      `SELECT p.*, a.account_name, a.institution 
       FROM payments p
       JOIN accounts a ON p.account_id = a.id
       WHERE p.account_id IN (${accountIds.map(() => '?').join(',')})
       ORDER BY p.payment_date DESC`,
      accountIds
    );

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error in getPayments:', error);
    next(new AppError('Error fetching payments', 500));
  }
};

exports.getPaymentStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const accountIds = await getUserAccountIds(userId);
    
    if (accountIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          totalPayments: 0,
          completedPayments: 0,
          pendingPayments: 0,
          failedPayments: 0,
          totalPaid: 0
        }
      });
    }

    const [stats] = await query(
      `SELECT 
        COUNT(*) as totalPayments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedPayments,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingPayments,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedPayments,
        COALESCE(SUM(amount), 0) as totalPaid
       FROM payments 
       WHERE account_id IN (${accountIds.map(() => '?').join(',')})`,
      accountIds
    );

    res.status(200).json({
      status: 'success',
      data: {
        totalPayments: stats.totalPayments || 0,
        completedPayments: stats.completedPayments || 0,
        pendingPayments: stats.pendingPayments || 0,
        failedPayments: stats.failedPayments || 0,
        totalPaid: parseFloat(stats.totalPaid) || 0
      }
    });
  } catch (error) {
    console.error('Error in getPaymentStats:', error);
    next(new AppError('Error fetching payment statistics', 500));
  }
};
