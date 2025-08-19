const { Sequelize } = require('sequelize');

async function initMetaTable() {
  const sequelize = new Sequelize('debt_manager', 'postgres', 'admin', {
    host: 'localhost',
    dialect: 'postgres',
    logging: console.log,
  });

  try {
    console.log('Creating SequelizeMeta table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL,
        PRIMARY KEY ("name"),
        UNIQUE ("name")
      );
    `);
    
    console.log('SequelizeMeta table created successfully!');
  } catch (error) {
    console.error('Error creating SequelizeMeta table:', error);
  } finally {
    await sequelize.close();
  }
}

initMetaTable();
