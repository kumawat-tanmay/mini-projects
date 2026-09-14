const express = require('express');
const { verifyToken } = require('../../middlewares/auth');
const {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  saveApiKey,
  deleteApiKey,
  setDefaultProvider,
  generatePost,
  publishPost,
} = require('./controller');

const router = express.Router();

// Require JWT authentication for all LinkedIn endpoints
router.use(verifyToken);

router.get('/auth-url', getAuthUrl);
router.post('/callback', handleCallback);
router.get('/status', getStatus);
router.post('/disconnect', disconnect);
router.post('/api-key', saveApiKey);
router.delete('/api-key', deleteApiKey);
router.post('/default-provider', setDefaultProvider);
router.post('/generate', generatePost);
router.post('/publish', publishPost);

module.exports = router;
