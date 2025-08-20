-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  account_type ENUM('savings', 'cheque', 'credit_card', 'loan', 'other') NOT NULL,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  institution VARCHAR(100) NOT NULL,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'ZAR',
  is_active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_account_number (account_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create credit score history table
CREATE TABLE IF NOT EXISTS credit_score_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  score INT NOT NULL,
  score_type ENUM('experian', 'transunion', 'xds', 'clearscore', 'other') NOT NULL,
  report_date DATE NOT NULL,
  factors JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_report_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY,
  account_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  transaction_type ENUM('debit', 'credit') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  reference VARCHAR(100),
  category VARCHAR(50),
  transaction_date TIMESTAMP NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_account_id (account_id),
  INDEX idx_user_id (user_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
