require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const { testConnection } = require('./config/db');
const { errorHandler } = require('./middleware/error');
const logger = require('./utils/logger');

// Import routes
const apiRoutes = require('./routes');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Configure CORS
const allowedOrigins = [
  'https://debt-man.vercel.app',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: ${origin} not allowed`;
      console.warn(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enable pre-flight across-the-board
app.options('*', cors());

// Compress all responses
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply to all API routes
app.use('/api', limiter);

// API routes
app.use('/api/v1', apiRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection() ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Handle 404
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  
  // Test database connection
  const dbConnected = await testConnection();
  if (dbConnected) {
    logger.info('✅ Database connection established successfully');
  } else {
    logger.error('❌ Failed to connect to database');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  logger.error(err.stack);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM (for Docker)
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

module.exports = server;
