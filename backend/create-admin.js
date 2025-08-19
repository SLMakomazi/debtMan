const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize('debt_manager', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});

async function createAdminUser() {
  try {
    // Check if admin already exists
    const [existingAdmin] = await sequelize.query(
      'SELECT id FROM users WHERE email = :email',
      {
        replacements: { email: 'admin@debtman.com' },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin', salt);

    // Insert admin user
    await sequelize.query(
      `INSERT INTO users ("firstName", "lastName", email, password, "isAdmin", "createdAt", "updatedAt")
       VALUES (:firstName, :lastName, :email, :password, true, NOW(), NOW())`,
      {
        replacements: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@debtman.com',
          password: hashedPassword,
        },
      }
    );

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@debtman.com');
    console.log('Password: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Install bcrypt if not already installed
try {
  createAdminUser();
} catch (error) {
  if (error.message.includes('Cannot find module')) {
    console.log('Installing bcrypt...');
    const { execSync } = require('child_process');
    execSync('npm install bcryptjs', { stdio: 'inherit' });
    console.log('bcrypt installed. Please run this script again.');
  } else {
    console.error('Error:', error.message);
  }
}
