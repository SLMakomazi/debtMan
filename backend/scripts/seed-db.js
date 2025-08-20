require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const logger = require('../utils/logger');

// Sample data
const sampleUsers = [
  {
    id: uuidv4(),
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    password: 'Password123!',
    phone_number: '0831234567',
    id_number: '9001015009087',
    date_of_birth: '1990-01-01',
    is_verified: true,
    is_admin: false,
    credit_score: 720,
    credit_score_updated_at: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    password: 'Password123!',
    phone_number: '0829876543',
    id_number: '9102025009088',
    date_of_birth: '1991-02-02',
    is_verified: true,
    is_admin: false,
    credit_score: 680,
    credit_score_updated_at: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  }
];

const sampleAccounts = [
  {
    id: uuidv4(),
    user_id: '', // Will be set programmatically
    account_type: 'savings',
    account_number: '1234567890',
    account_name: 'John Doe Savings',
    institution: 'FNB',
    balance: 15000.50,
    currency: 'ZAR',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    user_id: '', // Will be set programmatically
    account_type: 'credit_card',
    account_number: '9876543210',
    account_name: 'John Doe Credit Card',
    institution: 'Standard Bank',
    balance: -5000.00,
    credit_limit: 15000.00,
    currency: 'ZAR',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    user_id: '', // Will be set programmatically
    account_type: 'savings',
    account_number: '5555555555',
    account_name: 'Jane Smith Savings',
    institution: 'Nedbank',
    balance: 5000.00,
    currency: 'ZAR',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
];

const sampleTransactions = [
  {
    id: uuidv4(),
    account_id: '', // Will be set programmatically
    transaction_type: 'debit',
    amount: 1000.00,
    description: 'Grocery shopping',
    reference: 'POS123456',
    category: 'Groceries',
    transaction_date: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    account_id: '', // Will be set programmatically
    transaction_type: 'credit',
    amount: 5000.00,
    description: 'Salary deposit',
    reference: 'SALARY123',
    category: 'Income',
    transaction_date: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    account_id: '', // Will be set programmatically
    transaction_type: 'debit',
    amount: 250.50,
    description: 'Electricity bill',
    reference: 'UTILITY987',
    category: 'Utilities',
    transaction_date: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  }
];

const sampleCreditScores = [
  {
    id: uuidv4(),
    user_id: '', // Will be set programmatically
    score: 720,
    bureau: 'Experian',
    report_date: new Date(),
    factors: JSON.stringify({
      payment_history: 0.95,
      credit_utilization: 0.65,
      credit_history_length: 0.8,
      credit_mix: 0.75,
      new_credit: 0.9
    }),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    user_id: '', // Will be set programmatically
    score: 680,
    bureau: 'TransUnion',
    report_date: new Date(),
    factors: JSON.stringify({
      payment_history: 0.85,
      credit_utilization: 0.75,
      credit_history_length: 0.7,
      credit_mix: 0.65,
      new_credit: 0.95
    }),
    created_at: new Date(),
    updated_at: new Date()
  }
];

async function seedDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    
    logger.info('Starting database seeding...');
    
    // Hash passwords for sample users
    for (const user of sampleUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      user.password = hashedPassword;
      
      // Insert user
      await connection.query(
        `INSERT INTO users (
          id, first_name, last_name, email, password, phone_number, id_number, 
          date_of_birth, is_verified, is_admin, credit_score, credit_score_updated_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id, user.first_name, user.last_name, user.email, user.password, 
          user.phone_number, user.id_number, user.date_of_birth, user.is_verified, 
          user.is_admin, user.credit_score, user.credit_score_updated_at,
          user.created_at, user.updated_at
        ]
      );
      
      logger.info(`✅ Added user: ${user.email}`);
    }
    
    // Set user IDs in accounts
    sampleAccounts[0].user_id = sampleUsers[0].id; // John's accounts
    sampleAccounts[1].user_id = sampleUsers[0].id;
    sampleAccounts[2].user_id = sampleUsers[1].id; // Jane's account
    
    // Insert accounts
    for (const account of sampleAccounts) {
      await connection.query(
        `INSERT INTO accounts (
          id, user_id, account_type, account_number, account_name, 
          institution, balance, credit_limit, currency, is_active, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          account.id, account.user_id, account.account_type, account.account_number, 
          account.account_name, account.institution, account.balance, 
          account.credit_limit || null, account.currency, account.is_active,
          account.created_at, account.updated_at
        ]
      );
      
      logger.info(`✅ Added ${account.account_type} account: ${account.account_name}`);
    }
    
    // Set account IDs in transactions (first two transactions for John's savings, third for Jane's savings)
    sampleTransactions[0].account_id = sampleAccounts[0].id;
    sampleTransactions[1].account_id = sampleAccounts[0].id;
    sampleTransactions[2].account_id = sampleAccounts[2].id;
    
    // Insert transactions
    for (const transaction of sampleTransactions) {
      await connection.query(
        `INSERT INTO transactions (
          id, account_id, transaction_type, amount, description, 
          reference, category, transaction_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id, transaction.account_id, transaction.transaction_type, 
          transaction.amount, transaction.description, transaction.reference, 
          transaction.category, transaction.transaction_date, 
          transaction.created_at, transaction.updated_at
        ]
      );
      
      logger.info(`✅ Added ${transaction.transaction_type} transaction: ${transaction.description}`);
    }
    
    // Set user IDs in credit scores
    sampleCreditScores[0].user_id = sampleUsers[0].id; // John's credit score
    sampleCreditScores[1].user_id = sampleUsers[1].id; // Jane's credit score
    
    // Insert credit scores
    for (const creditScore of sampleCreditScores) {
      await connection.query(
        `INSERT INTO credit_score_history (
          id, user_id, score, bureau, report_date, 
          factors, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          creditScore.id, creditScore.user_id, creditScore.score, 
          creditScore.bureau, creditScore.report_date, creditScore.factors,
          creditScore.created_at, creditScore.updated_at
        ]
      );
      
      logger.info(`✅ Added credit score from ${creditScore.bureau} for user ID: ${creditScore.user_id}`);
    }
    
    // Commit transaction
    await connection.commit();
    logger.info('✅ Database seeding completed successfully!');
    
  } catch (error) {
    // Rollback transaction on error
    if (connection) await connection.rollback();
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.release();
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
