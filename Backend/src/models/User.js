import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema - Stores both manual and Google OAuth users
 * All users are stored in the same collection
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      // Password is not required for Google OAuth users
      required: function () {
        return !this.isGoogleUser;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default in queries
    },
    // Flag to identify Google OAuth users
    isGoogleUser: {
      type: Boolean,
      default: false,
    },
    // Store Google ID for Google OAuth users
    googleId: {
      type: String,
      default: null,
    },
    // User role: 'user' or 'superadmin'
    role: {
      type: String,
      enum: ['user', 'superadmin'],
      default: 'user',
    },
    // Optional: store avatar URL from Google
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

/**
 * Pre-save middleware to hash password before saving
 * Only hash if password is modified and user is not a Google user
 */
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new) and not a Google user
  if (!this.isModified('password') || this.isGoogleUser) return;

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method to compare entered password with stored hash
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
