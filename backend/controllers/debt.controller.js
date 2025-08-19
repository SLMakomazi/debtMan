const { Debt } = require('../models');

const getAllDebts = async (req, res) => {
  try {
    const { type, status } = req.query;
    const where = { userId: req.user.id };
    
    if (type) where.type = type;
    if (status) where.status = status;
    
    const debts = await Debt.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    
    res.json(debts);
  } catch (error) {
    console.error('Get all debts error:', error);
    res.status(500).json({ error: 'Failed to fetch debts' });
  }
};

const getDebtById = async (req, res) => {
  try {
    const debt = await Debt.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    
    res.json(debt);
  } catch (error) {
    console.error('Get debt by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch debt' });
  }
};

const createDebt = async (req, res) => {
  try {
    const { amount, description, dueDate, status = 'pending', type } = req.body;
    
    const debt = await Debt.create({
      amount,
      description,
      dueDate,
      status,
      type,
      userId: req.user.id,
    });
    
    res.status(201).json(debt);
  } catch (error) {
    console.error('Create debt error:', error);
    res.status(500).json({ error: 'Failed to create debt' });
  }
};

const updateDebt = async (req, res) => {
  try {
    const { amount, description, dueDate, status, type } = req.body;
    
    const [updated] = await Debt.update(
      {
        amount,
        description,
        dueDate,
        status,
        type,
      },
      {
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
        returning: true,
      }
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    
    const updatedDebt = await Debt.findByPk(req.params.id);
    res.json(updatedDebt);
  } catch (error) {
    console.error('Update debt error:', error);
    res.status(500).json({ error: 'Failed to update debt' });
  }
};

const deleteDebt = async (req, res) => {
  try {
    const deleted = await Debt.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete debt error:', error);
    res.status(500).json({ error: 'Failed to delete debt' });
  }
};

module.exports = {
  getAllDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
};
