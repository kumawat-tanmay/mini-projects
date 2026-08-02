const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  deleteAllNotes,
  reorderNotes,
  getStats,
} = require('./controller');

// All routes require authentication
router.use(verifyToken);

// Stats must come before /:id to avoid route conflict
router.get('/stats', getStats);

router.get('/', getAllNotes);
router.post('/', createNote);
router.patch('/reorder', reorderNotes);
router.delete('/all', deleteAllNotes);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
