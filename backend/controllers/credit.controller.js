const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { pool } = require('../config/db');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Helper function to handle database queries
const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Get credit score from Experian South Africa (mock implementation)
const getCreditScoreFromExperian = async (idNumber) => {
  // In a real implementation, this would call the Experian API
  // This is a mock implementation for demonstration purposes
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a random credit score between 300 and 850
    const score = Math.floor(Math.random() * (850 - 300 + 1)) + 300;
    
    // Generate mock credit factors
    const factors = {
      paymentHistory: (Math.random() * 100).toFixed(2),
      creditUtilization: (Math.random() * 100).toFixed(2),
      creditHistoryLength: Math.floor(Math.random() * 30) + 1, // 1-30 years
      recentInquiries: Math.floor(Math.random() * 10),
      creditMix: (Math.random() * 100).toFixed(2)
    };
    
    return {
      success: true,
      score,
      scoreType: 'experian',
      reportDate: new Date().toISOString().split('T')[0],
      factors
    };
  } catch (error) {
    logger.error('Error in getCreditScoreFromExperian:', error);
    throw new Error('Failed to fetch credit score from Experian');
  }
};

// Get credit score for a user
exports.getCreditScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only allow users to view their own credit score or admins
    if (id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view this credit score', 403)
      );
    }

    // Check if we have a recent credit score (less than 30 days old)
    const [recentScore] = await query(
      `SELECT * FROM credit_score_history 
       WHERE user_id = ? AND DATEDIFF(NOW(), report_date) <= 30 
       ORDER BY report_date DESC LIMIT 1`,
      [id]
    );

    if (recentScore) {
      return res.status(200).json({
        status: 'success',
        data: {
          creditScore: recentScore,
          isCached: true
        },
      });
    }

    // If no recent score, fetch a new one from the credit bureau
    const [user] = await query('SELECT id_number FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get credit score from Experian
    const creditData = await getCreditScoreFromExperian(user.id_number);
    
    if (!creditData.success) {
      return next(new AppError('Failed to fetch credit score', 500));
    }

    // Save the new credit score to the database
    await query(
      `INSERT INTO credit_score_history 
       (id, user_id, score, score_type, report_date, factors) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        id,
        creditData.score,
        creditData.scoreType,
        creditData.reportDate,
        JSON.stringify(creditData.factors)
      ]
    );

    // Update the user's credit score
    await query(
      'UPDATE users SET credit_score = ?, credit_score_updated_at = NOW() WHERE id = ?',
      [creditData.score, id]
    );

    // Get the saved credit score record
    const [savedScore] = await query(
      'SELECT * FROM credit_score_history WHERE user_id = ? ORDER BY report_date DESC LIMIT 1',
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        creditScore: savedScore,
        isCached: false
      },
    });
  } catch (error) {
    logger.error('Error in getCreditScore:', error);
    next(error);
  }
};

// Get credit score history for a user
exports.getCreditScoreHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 12, offset = 0 } = req.query;
    
    // Only allow users to view their own credit score history or admins
    if (id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view this credit score history', 403)
      );
    }

    // Get total count for pagination
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM credit_score_history WHERE user_id = ?',
      [id]
    );
    const total = countResult ? countResult.total : 0;

    // Get paginated credit score history
    const history = await query(
      `SELECT id, score, score_type, report_date, created_at 
       FROM credit_score_history 
       WHERE user_id = ? 
       ORDER BY report_date DESC 
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({
      status: 'success',
      results: history.length,
      total,
      data: {
        history,
      },
    });
  } catch (error) {
    logger.error('Error in getCreditScoreHistory:', error);
    next(error);
  }
};

// Get credit score factors for a user
exports.getCreditScoreFactors = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only allow users to view their own credit score factors or admins
    if (id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view these credit score factors', 403)
      );
    }

    // Get the most recent credit score with factors
    const [creditScore] = await query(
      `SELECT factors FROM credit_score_history 
       WHERE user_id = ? 
       ORDER BY report_date DESC 
       LIMIT 1`,
      [id]
    );

    if (!creditScore) {
      return next(new AppError('No credit score found for this user', 404));
    }

    // Parse the factors JSON
    const factors = typeof creditScore.factors === 'string' 
      ? JSON.parse(creditScore.factors) 
      : creditScore.factors;

    res.status(200).json({
      status: 'success',
      data: {
        factors,
      },
    });
  } catch (error) {
    logger.error('Error in getCreditScoreFactors:', error);
    next(error);
  }
};

// Request a full credit report (would integrate with credit bureau API in production)
exports.requestFullCreditReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only allow users to request their own credit report or admins
    if (id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to request this credit report', 403)
      );
    }

    // In a real implementation, this would initiate a request to the credit bureau
    // and return a report ID that can be used to check the status
    
    // For now, simulate a successful request
    const reportId = `REP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    res.status(202).json({
      status: 'success',
      message: 'Credit report request received',
      data: {
        reportId,
        status: 'processing',
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      },
    });
  } catch (error) {
    logger.error('Error in requestFullCreditReport:', error);
    next(error);
  }
};

// Get credit report status (would integrate with credit bureau API in production)
exports.getCreditReportStatus = async (req, res, next) => {
  try {
    const { id, reportId } = req.params;
    
    // Only allow users to check their own credit report status or admins
    if (id !== req.user.id && !req.user.is_admin) {
      return next(
        new AppError('You are not authorized to view this credit report status', 403)
      );
    }

    // In a real implementation, this would check the status with the credit bureau
    // using the reportId
    
    // For now, simulate a completed report
    const status = 'completed';
    const reportUrl = status === 'completed' 
      ? `https://api.example.com/credit-reports/${reportId}`
      : null;
    
    res.status(200).json({
      status: 'success',
      data: {
        reportId,
        status,
        reportUrl,
        ...(status === 'completed' && { 
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
      },
    });
  } catch (error) {
    logger.error('Error in getCreditReportStatus:', error);
    next(error);
  }
};
