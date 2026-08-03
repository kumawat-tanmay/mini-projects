const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../../middlewares/auth');
const {
  getAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  deleteAllPrompts,
  extractTextFromFile
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
router.get('/', getAllPrompts);
router.post('/', createPrompt);
router.patch('/:id', updatePrompt);
router.delete('/', deleteAllPrompts);
router.delete('/:id', deletePrompt);

// File Upload Route
router.post('/extract', upload.single('file'), extractTextFromFile);

module.exports = router;
