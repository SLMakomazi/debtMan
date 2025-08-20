require('dotenv').config();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function createDatabase() {
  let connection;
  try {
    // Create connection to MySQL server without specifying a database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
    });

    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    logger.info(`✅ Database '${process.env.DB_NAME}' created or already exists`);
    
    // Switch to the database
    await connection.query(`USE \`${process.env.DB_NAME}\``);
    
    // Create migrations table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Run migrations
    await runMigrations(connection);
    
    // Create admin user if it doesn't exist
    await createAdminUser(connection);
    
    logger.info('✅ Database setup completed successfully');
  } catch (error) {
    logger.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

async function runMigrations(connection) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = (await fs.readdir(migrationsDir))
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Get already run migrations
    const [runMigrations] = await connection.query('SELECT name FROM migrations');
    const runMigrationNames = new Set(runMigrations.map(m => m.name));
    
    // Run new migrations
    for (const file of migrationFiles) {
      if (!runMigrationNames.has(file)) {
        logger.info(`Running migration: ${file}`);
        
        // Read and execute the migration file
        const migrationSQL = await fs.readFile(path.join(migrationsDir, file), 'utf8');
        await connection.query(migrationSQL);
        
        // Record the migration
        await connection.query('INSERT INTO migrations (name) VALUES (?)', [file]);
        logger.info(`✅ Migration completed: ${file}`);
      }
    }
    
    logger.info('✅ All migrations have been run');
  } catch (error) {
    logger.error('❌ Error running migrations:', error);
    throw error;
  }
}

async function createAdminUser(connection) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@debtman.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    // Check if admin user already exists
    const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    
    if (users.length === 0) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create admin user
      const userId = uuidv4();
      await connection.query(
        `INSERT INTO users (
          id, first_name, last_name, email, password, phone_number, 
          id_number, is_verified, is_admin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          'Admin',
          'User',
          adminEmail,
          hashedPassword,
          '0000000000',
          '0000000000000',
          true,
          true
        ]
      );
      
      logger.info('✅ Admin user created successfully');
      logger.info(`   Email: ${adminEmail}`);
      logger.info(`   Password: ${adminPassword}`);
      logger.warn('⚠️  Please change the admin password after first login!');
    } else {
      logger.info('ℹ️  Admin user already exists');
    }
  } catch (error) {
    logger.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Run the setup
createDatabase();
