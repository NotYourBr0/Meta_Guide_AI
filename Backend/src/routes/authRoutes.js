import express from 'express';
import { register, login, googleAuth, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Auth Routes
 * Base path: /api/auth
 */

// Public routes
router.post('/register', register);      // Manual registration
router.post('/login', login);            // Manual login
router.post('/google-auth', googleAuth); // Google OAuth (sign-in or sign-up)

// Protected routes (require valid JWT token)
router.get('/me', protect, getMe);       // Get current user info

export default router;
