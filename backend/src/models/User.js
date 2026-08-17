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
  focusMix: {
    rain: { type: Number, default: 0 },
    cafe: { type: Number, default: 0 },
    noise: { type: Number, default: 0 },
    keyboard: { type: Number, default: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
