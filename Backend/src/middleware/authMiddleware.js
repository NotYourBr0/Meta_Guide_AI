import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const resolveUserFromRequest = async (req) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    throw new Error('User not found.');
  }

  return user;
};

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * Adds decoded user info to request object
 */
export const protect = async (req, res, next) => {
  try {
    const user = await resolveUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. No token provided.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token is invalid or expired.',
    });
  }
};

export const optionalProtect = async (req, _res, next) => {
  try {
    const user = await resolveUserFromRequest(req);
    req.user = user || null;
  } catch (_error) {
    req.user = null;
  }

  next();
};

/**
 * Super Admin Middleware
 * Checks if the logged-in user has superadmin role
 * Must be used AFTER protect middleware
 */
export const superAdminOnly = (req, res, next) => {
  try {
    const userName = req.user.name; 
    console.log(`User ${userName} is chatting`);
    // Check if user role is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.',
      });
    }

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization',
      error: error.message,
    });
  }
};
