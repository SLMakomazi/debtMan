const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Debt extends Model {
    static associate(models) {
      // Define associations here
      Debt.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }

  Debt.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'pending',
    },
    type: {
      type: DataTypes.ENUM('debt', 'credit'),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    sequelize,
    modelName: 'Debt',
    tableName: 'debts',
    timestamps: true,
    underscored: true,
  });

  return Debt;
};
