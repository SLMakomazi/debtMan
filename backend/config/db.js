require('dotenv').config();
const mysql = require('mysql2/promise');


// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'debt_manager',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Log database configuration (without sensitive data)
console.log('Database Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: !!dbConfig.ssl
});

// Test the database connection
const testConnection = async () => {
  try {
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
