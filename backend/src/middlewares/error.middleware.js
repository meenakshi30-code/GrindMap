import { HTTP_STATUS, ENVIRONMENTS } from '../constants/app.constants.js';
import Logger from '../utils/logger.js';

/**
 * Enhanced error handler with structured logging
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errorCode = 'SERVER_ERROR' } = err;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }
  
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = 'DUPLICATE_FIELD';
    message = process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION 
      ? 'Duplicate field value' 
      : `Duplicate field: ${Object.keys(err.keyValue).join(', ')}`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }

  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = 'INVALID_ID';
    message = 'Invalid resource ID';
  }

  // Structured error logging
  Logger.error('Request error', {
    correlationId: req.correlationId,
    error: {
      message: err.message,
      statusCode,
      errorCode,
      stack: process.env.NODE_ENV === ENVIRONMENTS.DEVELOPMENT ? err.stack : undefined
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Send standardized error response
  const response = {
    success: false,
    message: process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION && statusCode >= 500 
      ? 'Internal server error' 
      : message,
    errorCode,
    correlationId: req.correlationId
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === ENVIRONMENTS.DEVELOPMENT && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
  Logger.warn('Route not found', {
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errorCode: 'ROUTE_NOT_FOUND',
    correlationId: req.correlationId
  });
};

export { errorHandler, notFound };
