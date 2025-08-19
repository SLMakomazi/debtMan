const { Sequelize } = require('sequelize');

async function checkTables() {
  const sequelize = new Sequelize('debt_manager', 'postgres', 'admin', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
  });

  try {
    console.log('🔍 Checking database tables...');
    
    // List all tables in the public schema
    const [tables] = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );
    
    console.log('📋 Database tables:');
    tables.forEach(table => console.log(` - ${table.table_name}`));
    
    // Check if the tables have the expected columns
    const checkTable = async (tableName) => {
      console.log(`\n🔍 Checking table: ${tableName}`);
      const [columns] = await sequelize.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = '${tableName}'
         ORDER BY ordinal_position`
      );
      console.table(columns);
    };
    
    // Check users and debts tables
    if (tables.some(t => t.table_name === 'users')) {
      await checkTable('users');
    }
    
    if (tables.some(t => t.table_name === 'debts')) {
      await checkTable('debts');
    }
    
    console.log('✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();
