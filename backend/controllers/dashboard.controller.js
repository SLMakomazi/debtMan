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

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's account IDs
    const accountIds = await getUserAccountIds(userId);
    
    if (accountIds.length === 0) {
      // If user has no accounts, return empty stats
      return res.status(200).json({
        status: 'success',
        data: {
          totalAccounts: 0,
          totalTransactions: 0,
          completedTransactions: 0,
          pendingTransactions: 0,
          failedTransactions: 0,
          totalCredits: 0,
          totalDebits: 0,
          totalPayments: 0,
          completedPayments: 0,
          pendingPayments: 0,
          failedPayments: 0,
          totalPaid: 0,
          recentActivities: []
        }
      });
    }
    
    // Get total number of accounts
    const [accounts] = await query('SELECT COUNT(*) as total FROM accounts WHERE user_id = ?', [userId]);
    
    // Get transaction stats for user's accounts
    const [transactionStats] = await query(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as totalCredits,
        SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) as totalDebits
      FROM transactions 
      WHERE account_id IN (${accountIds.map(() => '?').join(',')})
    `, accountIds);

    // Get payment stats for user's accounts
    const [paymentStats] = await query(`
      SELECT 
        COUNT(*) as totalPayments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedPayments,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingPayments,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedPayments,
        SUM(amount) as totalPaid
      FROM payments 
      WHERE account_id IN (${accountIds.map(() => '?').join(',')})
    `, accountIds);

    // Get recent transactions (last 5)
    const recentTransactions = await query(`
      SELECT t.*, a.account_name, a.institution, 'transaction' as type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.account_id IN (${accountIds.map(() => '?').join(',')})
      ORDER BY t.transaction_date DESC 
      LIMIT 5
    `, accountIds);

    // Get recent payments (last 5)
    const recentPayments = await query(`
      SELECT p.*, 'payment' as type
      FROM payments p
      WHERE p.account_id IN (${accountIds.map(() => '?').join(',')})
      ORDER BY p.payment_date DESC 
      LIMIT 5
    `, accountIds);

    // Combine and sort recent activities
    const recentActivities = [...recentTransactions, ...recentPayments]
      .sort((a, b) => new Date(b.transaction_date || b.payment_date) - new Date(a.transaction_date || a.payment_date))
      .slice(0, 5);

    res.status(200).json({
      status: 'success',
      data: {
        // Account stats
        totalAccounts: accounts.total || 0,
        
        // Transaction stats
        totalTransactions: transactionStats.totalTransactions || 0,
        completedTransactions: transactionStats.completed || 0,
        pendingTransactions: transactionStats.pending || 0,
        failedTransactions: transactionStats.failed || 0,
        totalCredits: parseFloat(transactionStats.totalCredits) || 0,
        totalDebits: parseFloat(transactionStats.totalDebits) || 0,
        
        // Payment stats
        totalPayments: paymentStats.totalPayments || 0,
        completedPayments: paymentStats.completedPayments || 0,
        pendingPayments: paymentStats.pendingPayments || 0,
        failedPayments: paymentStats.failedPayments || 0,
        totalPaid: parseFloat(paymentStats.totalPaid) || 0,
        
        // Combined recent activities
        recentActivities: recentActivities
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    next(new AppError('Error fetching dashboard data', 500));
  }
};
