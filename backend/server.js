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

// Enhanced request logging
app.use((req, res, next) => {
  console.log(`🌐 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.headers.origin || 'unknown origin'}`);
  next();
});

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure CORS
const allowedOrigins = [
  'https://debt-man.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000'
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🌍 CORS check for origin: ${origin || 'no origin'}`);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('   ✅ Development mode - allowing all origins');
      return callback(null, true);
    }
    
    // In production, only allow specific origins
    if (allowedOrigins.includes(origin) || !origin) {
      console.log(`   ✅ Allowed origin: ${origin || 'no origin (server-side request)'}`);
      return callback(null, true);
    }
    
    const msg = `CORS policy: ${origin} not allowed`;
    console.warn(`   ❌ ${msg}`);
    console.log('   Allowed origins:', allowedOrigins);
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length'],
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Enable CORS
app.use(cors(corsOptions));

// Enable pre-flight across-the-board
app.options('*', cors(corsOptions));

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
  console.log('\n🚀 Server startup sequence initiated');
  console.log('================================');
  console.log(`🌐 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔊 Listening on port ${PORT}`);
  console.log(`🔄 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  console.log('--------------------------------');
  
  // Test database connection
  console.log('🔍 Testing database connection...');
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    console.log('✅ Database connection established successfully');
    console.log('--------------------------------');
    console.log('🔗 Connection Flow:');
    console.log('1. Frontend (Browser) → Backend (Node.js) ✅');
    console.log('2. Backend → Database (MySQL) ✅');
    console.log('--------------------------------');
    console.log('🚀 Server is fully operational and ready to handle requests!');
    console.log('================================\n');
  } else {
    console.error('❌ Failed to connect to database');
    console.log('--------------------------------');
    console.log('🔴 Connection Flow:');
    console.log('1. Frontend (Browser) → Backend (Node.js) ✅');
    console.log('2. Backend → Database (MySQL) ❌ FAILED');
    console.log('--------------------------------');
    console.error('❌ Server started but cannot connect to database!');
    console.log('================================\n');
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
