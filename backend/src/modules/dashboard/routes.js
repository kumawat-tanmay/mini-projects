const express = require('express');
const { verifyToken } = require('../../middlewares/auth');
const { getDashboardStats } = require('./controller');

const router = express.Router();

// Protect all routes
router.use(verifyToken);

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

module.exports = router;
