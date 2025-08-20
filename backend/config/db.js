require('dotenv').config();
const mysql = require('mysql2/promise');


// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true
});

// Test the database connection
const testConnection = async () => {
  try {
    // Log database configuration (without sensitive data)
    const dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      ssl: false,
      environment: process.env.NODE_ENV || 'development'
    };
    console.log('🔌 Database Configuration:', dbConfig);

    // Log database connection attempt
    console.log('🔍 Attempting to connect to database...');

    const connection = await pool.getConnection();
    console.log('✅ Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Export the pool and test function
module.exports = {
  pool,
  query: (text, params) => pool.execute(text, params),
  testConnection
};
