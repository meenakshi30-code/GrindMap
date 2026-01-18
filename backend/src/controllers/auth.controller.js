import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError, ERROR_CODES } from "../utils/appError.js";
import { sendSuccess, sendError } from "../utils/response.helper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HTTP_STATUS, MESSAGES } from "../constants/app.constants.js";

/**
 * JWT token expiration time
 */
const JWT_EXPIRES_IN = '7d';

/**
 * Generate JWT token for user authentication
 * @param {string} userId - User's database ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  });
};

/**
 * Controller for handling user authentication
 * Follows Single Responsibility Principle
 */
class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(
        "User already exists with this email", 
        HTTP_STATUS.BAD_REQUEST, 
        ERROR_CODES.USER_EXISTS
      );
    }

    // Create new user
    const user = await User.create({ name, email, password });

    // Generate token and send response
    const token = generateToken(user._id);
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      token,
    };

    sendSuccess(res, userData, "User registered successfully", HTTP_STATUS.CREATED);
  });

  /**
   * Login existing user
   * @route POST /api/auth/login
   */
  loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(
        "Invalid email or password", 
        HTTP_STATUS.UNAUTHORIZED, 
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        "Invalid email or password", 
        HTTP_STATUS.UNAUTHORIZED, 
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    // Generate token and send response
    const token = generateToken(user._id);
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      token,
    };

    sendSuccess(res, userData, "Login successful");
  });

  /**
   * Get current user profile
   * @route GET /api/auth/profile
   */
  getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      throw new AppError(
        "User not found", 
        HTTP_STATUS.NOT_FOUND, 
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    sendSuccess(res, user, "Profile retrieved successfully");
  });
}

export default new AuthController();
