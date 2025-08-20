const path = require('path');
const dotenv = require('dotenv');

// Load .env explicitly
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Failed to load .env:', result.error);
  process.exit(1);
}

console.log('✅ .env loaded successfully');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
