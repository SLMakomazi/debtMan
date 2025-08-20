require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const { createLogger, format, transports } = require('winston');

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new transports.Console()]
});

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
    connection = await pool.getConnection();
    logger.info('✅ Successfully connected to the database');
    
    // Drop all tables if they exist
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const [tables] = await connection.query("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    for (const table of tableNames) {
      logger.info(`Dropping table: ${table}`);
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Create migrations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Get list of migration files
    const migrationFiles = (await fs.readdir(MIGRATIONS_DIR))
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      logger.warn('⚠️  No migration files found in the migrations directory');
      return;
    }

    // Run migrations
    for (const file of migrationFiles) {
      try {
        logger.info(`🚀 Running migration: ${file}`);
        
        // Read and execute the migration file
        const migrationSQL = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
        
        // Split by semicolon and execute each statement separately
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
          
        for (const stmt of statements) {
          if (stmt) {
            await connection.query(stmt);
          }
        }
        
        // Record the migration
        await connection.query('INSERT INTO migrations (name) VALUES (?)', [file]);
        logger.info(`✅ Migration completed: ${file}`);
      } catch (error) {
        logger.error(`❌ Error in migration ${file}: ${error.message}`);
        throw error;
      }
    }

    logger.info('✨ All migrations have been run successfully');
  } catch (error) {
    logger.error('❌ Error running migrations:');
    logger.error(error.message);
    
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
