const express = require('express');
const { verifyToken } = require('../../middlewares/auth');
const { getFocusMix, updateFocusMix } = require('./controller');

const router = express.Router();

// Require authentication
router.use(verifyToken);

router.get('/', getFocusMix);
router.patch('/', updateFocusMix);

module.exports = router;
