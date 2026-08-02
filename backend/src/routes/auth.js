const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  googleLogin, 
  forgotPassword, 
  resetPassword,
  getMe
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected route to fetch current user profile
router.get('/me', verifyToken, getMe);

module.exports = router;
