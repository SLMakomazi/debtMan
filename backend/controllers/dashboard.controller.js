const { pool } = require('../config/db');
const AppError = require('../utils/appError');

// Helper function to execute SQL queries
const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get total number of credits
    const [credits] = await query('SELECT COUNT(*) as total FROM credits');
    
    // Get paid and pending credits
    const [creditStats] = await query(`
      SELECT 
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
        SUM(amount) as totalAmount
      FROM credits
    `);

    // Get recent payments (last 5)
    const recentPayments = await query(`
      SELECT * FROM payments 
      ORDER BY payment_date DESC 
      LIMIT 5
    `);

    res.status(200).json({
      status: 'success',
      data: {
        totalDebts: credits.total,
        paidDebts: creditStats.paid || 0,
        pendingDebts: creditStats.pending || 0,
        overdueDebts: creditStats.overdue || 0,
        totalAmount: creditStats.totalAmount || 0,
        recentPayments: recentPayments || []
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    next(new AppError('Error fetching dashboard data', 500));
  }
};
