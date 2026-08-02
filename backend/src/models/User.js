const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    // Optional because Google OAuth users won't have a password
    required: false, 
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpires: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
