const Whiteboard = require('./model');

// List all boards for the authenticated user (metadata only, excluding heavy canvasData)
exports.getBoards = async (req, res) => {
  try {
    let boards = await Whiteboard.find({ userId: req.user.id })
      .select('_id title updatedAt createdAt')
      .sort({ updatedAt: -1 });

    // Auto-create initial board for first-time user
    if (boards.length === 0) {
      const defaultBoard = new Whiteboard({
        userId: req.user.id,
        title: 'My First Whiteboard',
        canvasData: {},
      });
      await defaultBoard.save();
      boards = [
        {
          _id: defaultBoard._id,
          title: defaultBoard.title,
          updatedAt: defaultBoard.updatedAt,
          createdAt: defaultBoard.createdAt,
        },
      ];
    }

    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch boards list.' });
  }
};

// Fetch single board with full canvasData
exports.getBoardById = async (req, res) => {
  try {
    const board = await Whiteboard.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!board) {
      return res.status(404).json({ error: 'Whiteboard not found.' });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch whiteboard.' });
  }
};

// Create a new blank board
exports.createBoard = async (req, res) => {
  try {
    const title = (req.body.title || '').trim() || 'Untitled Board';
    const newBoard = new Whiteboard({
      userId: req.user.id,
      title,
      canvasData: {},
    });
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create whiteboard.' });
  }
};

// Update an existing board's canvasData and/or title
exports.updateBoard = async (req, res) => {
  try {
    const { canvasData, title } = req.body;
    const updateFields = {};
    if (canvasData !== undefined) updateFields.canvasData = canvasData;
    if (title !== undefined && typeof title === 'string') {
      updateFields.title = title.trim() || 'Untitled Board';
    }

    const board = await Whiteboard.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateFields,
      { new: true }
    );

    if (!board) {
      return res.status(404).json({ error: 'Whiteboard not found.' });
    }

    res.json({
      success: true,
      updatedAt: board.updatedAt,
      title: board.title,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update whiteboard.' });
  }
};

// Delete a board by ID
exports.deleteBoard = async (req, res) => {
  try {
    const result = await Whiteboard.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!result) {
      return res.status(404).json({ error: 'Whiteboard not found.' });
    }

    res.json({ success: true, message: 'Whiteboard deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete whiteboard.' });
  }
};
