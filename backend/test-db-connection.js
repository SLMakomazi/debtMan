const { Sequelize } = require('sequelize');

// PostgreSQL connection setup
const sequelize = new Sequelize('debt_manager', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false, // change to console.log if you want SQL queries to appear
});

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...");
    await sequelize.authenticate();
    console.log("✅ Connection has been established successfully.");

    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );

    console.log("📋 Tables in database:");
    tables.forEach(table => console.log(" -", table.table_name));
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  } finally {
    await sequelize.close();
  }
}

testConnection();
