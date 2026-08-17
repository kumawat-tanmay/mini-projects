const express = require('express');
const { verifyToken } = require('../../middlewares/auth');
const {
  getAllRequests,
  saveRequest,
  deleteRequest,
  proxyRequest
} = require('./controller');

const router = express.Router();

// Protect all routes in this module
router.use(verifyToken);

router.get('/', getAllRequests);
router.post('/', saveRequest);
router.delete('/:id', deleteRequest);
router.post('/proxy', proxyRequest);

module.exports = router;
