const express = require('express');
const { verifyToken } = require('../../middlewares/auth');
const { getWhiteboard, updateWhiteboard, clearWhiteboard } = require('./controller');

const router = express.Router();

// Require auth
router.use(verifyToken);

router.get('/', getWhiteboard);
router.put('/', updateWhiteboard);
router.delete('/', clearWhiteboard);

module.exports = router;
