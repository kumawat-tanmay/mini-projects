const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../../middlewares/auth');
const {
  getAllAssets,
  uploadAsset,
  deleteAsset,
  deleteAllAssets
} = require('./controller');

const router = express.Router();

// Multer setup for memory storage (file buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

// Protect all routes
router.use(verifyToken);

// CRUD Routes
router.get('/', getAllAssets);
router.post('/', upload.single('file'), uploadAsset);
router.delete('/all', deleteAllAssets);
router.delete('/:id', deleteAsset);

module.exports = router;
