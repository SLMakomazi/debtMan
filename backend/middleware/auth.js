const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { pool } = require('../config/db');
const AppError = require('../utils/appError');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token and check if it exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
      decoded.id,
    ]);
    const currentUser = rows[0];

    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.password_changed_at) {
      const changedTimestamp = parseInt(
        currentUser.password_changed_at.getTime() / 1000,
        10
      );

      if (decoded.iat < changedTimestamp) {
        return next(
          new AppError('User recently changed password! Please log in again.', 401)
        );
      }
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array of allowed roles ['admin', 'user']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
        decoded.id,
      ]);
      const currentUser = rows[0];

      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.password_changed_at) {
        const changedTimestamp = parseInt(
          currentUser.password_changed_at.getTime() / 1000,
          10
        );

        if (decoded.iat < changedTimestamp) {
          return next();
        }
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
