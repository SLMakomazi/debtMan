require('dotenv').config();

module.exports = {
  development: {
    username: 'postgres',
    password: 'admin',  // The password you used to connect
    database: 'debt_manager',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log,  // Enable query logging for debugging
  },
  test: {
    username: 'root',
    password: null,
    database: 'debtmanager_test',
    host: '127.0.0.1',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
  }
};
