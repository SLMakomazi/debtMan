const { Sequelize } = require('sequelize');
const { Umzug } = require('umzug');
const path = require('path');

// Initialize Sequelize with your database configuration
const sequelize = new Sequelize('debt_manager', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: console.log,
});

// Configure Umzug for migrations
const umzug = new Umzug({
  migrations: {
    glob: 'migrations/*.js',
    resolve: ({ name, path, context }) => {
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context.queryInterface, Sequelize),
        down: async () => migration.down(context.queryInterface, Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: {
    async executed() {
      const [results] = await sequelize.query(
        'SELECT name FROM SequelizeMeta ORDER BY name',
        { type: sequelize.QueryTypes.SELECT }
      );
      return results.map(r => r.name);
    },
    async logMigration({ name }) {
      await sequelize.query(
        'INSERT INTO "SequelizeMeta" (name) VALUES ($name)',
        { bind: { name } }
      );
    },
    async unlogMigration({ name }) {
      await sequelize.query(
        'DELETE FROM "SequelizeMeta" WHERE name = $name',
        { bind: { name } }
      );
    },
  },
  logger: console,
});

// Run the migrations
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Check current migration status
    const executed = await umzug.executed();
    console.log('Executed migrations:', executed);
    
    // Check pending migrations
    const pending = await umzug.pending();
    console.log('Pending migrations:', pending);
    
    if (pending.length === 0) {
      console.log('No pending migrations to run.');
      return;
    }
    
    // Execute pending migrations
    await umzug.up();
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
