import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Generate JWT Token
 * @param {string} userId - User's MongoDB ID
 * @param {string} role - User's role
 * @returns {string} JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Check if email belongs to super admin
 * @param {string} email - User's email
 * @returns {boolean} True if super admin
 */
const isSuperAdmin = (email) => {
  return email === process.env.SUPER_ADMIN_EMAIL;
};

/**
 * @desc    Register a new user (Manual registration)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation: Check if all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Determine role based on email
    const role = isSuperAdmin(email) ? 'superadmin' : 'user';

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      isGoogleUser: false,
    });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Return success response with token and user data
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isGoogleUser: user.isGoogleUser,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

/**
 * @desc    Login user (Manual login)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: Check if all required fields are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email and include password field (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is a Google OAuth user (cannot login with password)
    if (user.isGoogleUser) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.',
      });
    }

    // Compare provided password with stored hash
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update role if email matches super admin (in case env was updated)
    const role = isSuperAdmin(email) ? 'superadmin' : user.role;
    if (role !== user.role) {
      user.role = role;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id, role);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        isGoogleUser: user.isGoogleUser,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

/**
 * @desc    Google OAuth authentication (Sign-in or Sign-up)
 * @route   POST /api/auth/google-auth
 * @access  Public
 */
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    // Validation: Check if credential is provided
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
    }

    // Verify Google ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    // Get user info from Google token payload
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists with this email
    let user = await User.findOne({ email });

    if (user) {
      // User exists - Check if they registered manually before
      if (!user.isGoogleUser) {
        // Convert manual user to Google user or allow linking
        // Here we'll update the user to also support Google login
        user.isGoogleUser = true;
        user.googleId = googleId;
        if (picture) user.avatar = picture;
        
        // Update role if super admin
        user.role = isSuperAdmin(email) ? 'superadmin' : user.role;
        
        await user.save();
      } else {
        // Already a Google user - update role if needed
        const role = isSuperAdmin(email) ? 'superadmin' : user.role;
        if (role !== user.role) {
          user.role = role;
          await user.save();
        }
        // Update avatar if changed
        if (picture && user.avatar !== picture) {
          user.avatar = picture;
          await user.save();
        }
      }
    } else {
      // User doesn't exist - Create new user with Google data
      const role = isSuperAdmin(email) ? 'superadmin' : 'user';
      
      user = await User.create({
        name,
        email,
        googleId,
        isGoogleUser: true,
        role,
        avatar: picture || null,
        // No password for Google users
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Determine if this was a new registration or existing login
    const isNewUser = user.createdAt.getTime() === user.updatedAt.getTime();

    // Return success response
    res.status(200).json({
      success: true,
      message: user.isGoogleUser && !isNewUser 
        ? 'Google login successful' 
        : 'Google registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isGoogleUser: user.isGoogleUser,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current logged-in user info
 * @route   GET /api/auth/me
 * @access  Private (requires token)
 */
export const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = req.user;

    // Check if user exists (should be handled by middleware but good for safety)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Fetch subjects created by user
    const subjects = await Subject.find({ "createdBy.id": req.user.userId }).select('name level createdAt');
    
    // Fetch topics created by user
    const topics = await Topic.find({ "createdBy.id": req.user.userId }).select('name level subjectId createdAt');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isGoogleUser: user.isGoogleUser,
        avatar: user.avatar,
      },
      stats: {
        subjectsCount: subjects.length,
        topicsCount: topics.length,
        subjects,
        topics
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update user's display name (cascades to subjects & topics)
 * @route   PUT /api/auth/update-name
 * @access  Private
 */
export const updateName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty' });
    }
    if (name.trim().length > 50) {
      return res.status(400).json({ success: false, message: 'Name cannot exceed 50 characters' });
    }

    const userId = req.user._id.toString();
    const trimmedName = name.trim();

    // 1. Update the user document
    await User.findByIdAndUpdate(userId, { name: trimmedName });

    // 2. Cascade to all subjects created by this user
    await Subject.updateMany(
      { 'createdBy.id': userId },
      { $set: { 'createdBy.name': trimmedName } }
    );

    // 3. Cascade to all topics created by this user
    await Topic.updateMany(
      { 'createdBy.id': userId },
      { $set: { 'createdBy.name': trimmedName } }
    );

    res.status(200).json({
      success: true,
      message: 'Name updated successfully',
      name: trimmedName,
    });
  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
