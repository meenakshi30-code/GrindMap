import { body, param, validationResult } from 'express-validator';
import xss from 'xss';
import { AppError, ERROR_CODES } from '../utils/appError.js';
import { VALIDATION, HTTP_STATUS, MESSAGES } from '../constants/app.constants.js';

/**
 * Sanitization middleware to prevent XSS attacks
 * Cleans all user input (params, query, body)
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize URL parameters
  Object.keys(req.params).forEach(key => {
    if (typeof req.params[key] === 'string') {
      req.params[key] = xss(req.params[key].trim());
    }
  });

  // Sanitize query parameters
  Object.keys(req.query).forEach(key => {
    if (typeof req.query[key] === 'string') {
      req.query[key] = xss(req.query[key].trim());
    }
  });

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key].trim());
      }
    });
  }

  next();
};

/**
 * Validation error handler middleware
 * Converts express-validator errors to standardized format
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new AppError(
      errorMessages.join(', '), 
      HTTP_STATUS.BAD_REQUEST, 
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  next();
};

/**
 * Username validation rules for platform endpoints
 * Ensures username meets platform requirements
 */
const validateUsername = [
  param('username')
    .isLength({ 
      min: VALIDATION.USERNAME_MIN_LENGTH, 
      max: VALIDATION.USERNAME_MAX_LENGTH 
    })
    .withMessage(`Username must be ${VALIDATION.USERNAME_MIN_LENGTH}-${VALIDATION.USERNAME_MAX_LENGTH} characters`)
    .matches(VALIDATION.USERNAME_PATTERN)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores')
    .escape(),
  handleValidationErrors
];

/**
 * Email validation rules for authentication
 */
const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .escape(),
  handleValidationErrors
];

/**
 * Password validation rules for authentication
 */
const validatePassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

export { 
  sanitizeInput, 
  validateUsername, 
  validateEmail, 
  validatePassword, 
  handleValidationErrors 
};
