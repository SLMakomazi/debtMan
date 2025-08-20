# DebtMan Backend API

Backend API for the DebtMan application, a comprehensive debt management system with credit score integration for South African users.

## Features

- User authentication and authorization with JWT
- Credit score tracking and history
- Account management (savings, cheque, credit cards, loans)
- Transaction tracking
- Secure API endpoints with rate limiting
- Comprehensive error handling
- Logging with Winston
- Database migrations

## Tech Stack

- Node.js
- Express.js
- MySQL 8.0+
- JWT for authentication
- Winston for logging
- Express Validator for request validation
- Bcrypt for password hashing
- Helmet for security headers
- CORS for cross-origin requests
- Rate limiting for API protection

## Prerequisites

- Node.js 16+
- MySQL 8.0+
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/debtman.git
   cd debtman/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the backend directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database credentials and other settings.

5. Set up the database:
   ```bash
   node scripts/setup-db.js
   ```
   This will:
   - Create the database if it doesn't exist
   - Run all database migrations
   - Create an admin user (default: admin@debtman.com / Admin@123)

## Running the Application

### Development

```bash
npm run dev
# or
yarn dev
```

The server will start on `http://localhost:5000` by default.

### Production

```bash
npm start
# or
yarn start
```

## API Documentation

### Authentication

- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `PATCH /api/v1/auth/reset-password/:token` - Reset password
- `GET /api/v1/auth/me` - Get current user
- `PATCH /api/v1/auth/update-password` - Update password

### Users

- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (admin only)
- `GET /api/v1/users/:id/credit-score` - Get user's credit score
- `GET /api/v1/users/:id/accounts` - Get user's accounts
- `GET /api/v1/users/:id/transactions` - Get user's transactions

### Credit

- `GET /api/v1/credit/scores/:id` - Get credit score
- `GET /api/v1/credit/scores/:id/history` - Get credit score history
- `GET /api/v1/credit/scores/:id/factors` - Get credit score factors
- `POST /api/v1/credit/reports/:id/request` - Request full credit report
- `GET /api/v1/credit/reports/:id/status/:reportId` - Get credit report status

### Accounts

- `POST /api/v1/accounts/:id/accounts` - Create account
- `GET /api/v1/accounts/:id/accounts` - Get user's accounts
- `GET /api/v1/accounts/:id/accounts/:accountId` - Get account by ID
- `PATCH /api/v1/accounts/:id/accounts/:accountId` - Update account
- `DELETE /api/v1/accounts/:id/accounts/:accountId` - Delete account
- `POST /api/v1/accounts/:id/accounts/:accountId/transactions` - Create transaction
- `GET /api/v1/accounts/:id/accounts/:accountId/transactions` - Get transactions

## Environment Variables

```
# Server Configuration
NODE_ENV=development
PORT=5000

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES=7

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=debt_manager

# Admin User (created during setup)
ADMIN_EMAIL=admin@debtman.com
ADMIN_PASSWORD=Admin@123

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100

# CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## Testing

Run tests with:

```bash
npm test
# or
yarn test
```

## Linting

```bash
npm run lint
# or
yarn lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- [JWT](https://jwt.io/)
- [Winston](https://github.com/winstonjs/winston)
- [Express Validator](https://express-validator.github.io/)
