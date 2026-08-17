const Whiteboard = require('./model');

exports.getWhiteboard = async (req, res) => {
  try {
    let board = await Whiteboard.findOne({ userId: req.user.id });
    if (!board) {
      // Create empty board on first load
      board = new Whiteboard({
        userId: req.user.id,
        canvasData: {},
      });
      await board.save();
    }
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch whiteboard data.' });
  }
};

exports.updateWhiteboard = async (req, res) => {
  try {
    const { canvasData } = req.body;
    
    let board = await Whiteboard.findOneAndUpdate(
      { userId: req.user.id },
      { canvasData },
      { new: true, upsert: true }
    );

    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save whiteboard data.' });
  }
};
