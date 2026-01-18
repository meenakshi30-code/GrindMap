import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { validateEmail, validatePassword } from '../middlewares/validation.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be 2-50 characters long')
      .escape(),
    validateEmail,
    validatePassword
  ],
  AuthController.registerUser
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [validateEmail, body('password').notEmpty().withMessage('Password is required')],
  AuthController.loginUser
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', protect, AuthController.getUserProfile);

export default router;