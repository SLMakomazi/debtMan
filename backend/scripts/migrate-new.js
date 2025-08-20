// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Create a new connection pool for migrations
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

// Path to SQL migration files
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function runMigrations() {
  let connection;
  try {
    // Test the connection first
    connection = await pool.getConnection();
    logger.info('✅ Successfully connected to the database');
    
    // Create migrations table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationFiles = (await fs.readdir(MIGRATIONS_DIR))
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      logger.warn('⚠️  No migration files found in the migrations directory');
      return;
    }

    // Get already run migrations
    const [runMigrations] = await connection.query('SELECT name FROM migrations');
    const runMigrationNames = new Set(runMigrations.map(m => m.name));

    // Run new migrations
    for (const file of migrationFiles) {
      if (!runMigrationNames.has(file)) {
        logger.info(`🚀 Running migration: ${file}`);
        
        // Read and execute the migration file
        const migrationSQL = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
        await connection.query(migrationSQL);
        
        // Record the migration
        await connection.query('INSERT INTO migrations (name) VALUES (?)', [file]);
        logger.info(`✅ Migration completed: ${file}`);
      }
    }

    logger.info('✨ All migrations have been run successfully');
  } catch (error) {
    logger.error('❌ Error running migrations:');
    logger.error(error.message);
    
    // Provide more helpful error messages
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.error('🔑 Database authentication failed. Please check your DB_USER and DB_PASSWORD in .env');
      logger.error(`Trying to connect as: ${process.env.DB_USER}@${process.env.DB_HOST}`);
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      logger.error(`💾 Database '${process.env.DB_NAME}' does not exist. Create it first.`);
      logger.error('Run: CREATE DATABASE ' + process.env.DB_NAME + ';');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error(`🔌 Could not connect to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
      logger.error('Make sure MySQL is running and accessible at the specified host and port');
    } else if (error.code === 'ENOENT') {
      logger.error(`📁 Migrations directory not found at: ${MIGRATIONS_DIR}`);
      logger.error('Please create the migrations directory and add your SQL migration files');
    }
    
    process.exit(1);
  } finally {
    if (connection) await connection.release();
    await pool.end();
  }
}

// Run the migrations
runMigrations().catch(error => {
  logger.error('Unhandled error in migration script:', error);
  process.exit(1);
});
