const express = require('express');
const { verifyToken } = require('../../middlewares/auth');
const {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
} = require('./controller');

const router = express.Router();

// Require JWT authentication on all routes
router.use(verifyToken);

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:id', getBoardById);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);

module.exports = router;
