const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔍 Checking database connection...');
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to the database');
    
    console.log('\n📋 Listing all tables:');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('No tables found in the database');
    } else {
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        console.log(`\n📊 Table: ${tableName}`);
        try {
          const [columns] = await connection.query(`DESCRIBE ${tableName}`);
          console.table(columns);
        } catch (err) {
          console.error(`Error describing table ${tableName}:`, err.message);
        }
      }
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error connecting to the database:');
    console.error(error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔑 Authentication failed. Please check your database credentials in .env');
      console.error(`Trying to connect as: ${process.env.DB_USER}@${process.env.DB_HOST}`);
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`\n💾 Database '${process.env.DB_NAME}' does not exist.`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔌 Could not connect to MySQL server.');
      console.error('Make sure MySQL is running and accessible at the specified host and port');
    }
  } finally {
    await pool.end();
    process.exit();
  }
})();
