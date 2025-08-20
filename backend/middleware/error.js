const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  // Log the error
  logger.error(`[${new Date().toISOString()}] ${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return handleValidationError(err, res);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return handleDuplicateFieldsDB(err, res);
  }

  if (err.name === 'JsonWebTokenError') {
    return handleJWTError(res);
  }

  if (err.name === 'TokenExpiredError') {
    return handleJWTExpiredError(res);
  }

  // Default error response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Error handlers
const handleValidationError = (err, res) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return res.status(StatusCodes.BAD_REQUEST).json({
    status: 'fail',
    message
  });
};

const handleDuplicateFieldsDB = (err, res) => {
  const value = err.message.match(/(['"])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return res.status(StatusCodes.BAD_REQUEST).json({
    status: 'fail',
    message
  });
};

const handleJWTError = (res) => {
  return res.status(StatusCodes.UNAUTHORIZED).json({
    status: 'fail',
    message: 'Invalid token. Please log in again!'
  });
};

const handleJWTExpiredError = (res) => {
  return res.status(StatusCodes.UNAUTHORIZED).json({
    status: 'fail',
    message: 'Your token has expired! Please log in again.'
  });
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  AppError
};
