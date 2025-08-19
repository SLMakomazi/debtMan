const { Payment } = require('../models');

const getAllPayments = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { userId: req.user.id };
    
    if (status) where.status = status;
    
    const payments = await Payment.findAll({
      where,
      order: [['date', 'DESC']],
      limit: 50, // Limit to 50 most recent payments
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

const getPaymentStats = async (req, res) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as totalPaid,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as paymentsCount,
        COUNT(CASE WHEN status = 'scheduled' AND date BETWEEN NOW() AND NOW() + INTERVAL '30 days' THEN 1 END) as upcomingPayments
      FROM payments
      WHERE "userId" = :userId
    `, {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.SELECT,
    });

    res.json(stats);
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch payment stats' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentStats,
};
