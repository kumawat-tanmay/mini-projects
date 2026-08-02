const StickyNote = require('./model');

const MAX_NOTES_PER_USER = 30;

// GET /api/sticky-notes — List all notes for logged-in user
const getAllNotes = async (req, res) => {
  try {
    const { sort = 'newest', filter = 'all', date } = req.query;

    // Base query: always scoped to the logged-in user
    const query = { userId: req.user.id };

    // Date filter
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    // Status filter
    if (filter === 'pinned') query.isPinned = true;
    if (filter === 'active') query.isCompleted = false;
    if (filter === 'completed') query.isCompleted = true;

    // Sort config
    let sortConfig = {};
    switch (sort) {
      case 'oldest':
        sortConfig = { isPinned: -1, createdAt: 1 };
        break;
      case 'color':
        sortConfig = { isPinned: -1, bgColor: 1, position: 1 };
        break;
      case 'completed-last':
        sortConfig = { isPinned: -1, isCompleted: 1, position: 1 };
        break;
      case 'newest':
      default:
        sortConfig = { isPinned: -1, createdAt: -1 };
        break;
    }

    const notes = await StickyNote.find(query).sort(sortConfig).lean();
    res.json({ notes });
  } catch (error) {
    console.error('getAllNotes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
};

// POST /api/sticky-notes — Create a new note
const createNote = async (req, res) => {
  try {
    // Enforce max notes limit
    const count = await StickyNote.countDocuments({ userId: req.user.id });
    if (count >= MAX_NOTES_PER_USER) {
      return res.status(400).json({ 
        error: `You can have a maximum of ${MAX_NOTES_PER_USER} notes. Delete some to create new ones.` 
      });
    }

    const { title, content, bgColor, textColor } = req.body;

    const note = await StickyNote.create({
      userId: req.user.id,
      title: title || '',
      content: content || '',
      bgColor: bgColor || '#FACC15',
      textColor: textColor || '#000000',
    });

    res.status(201).json({ note });
  } catch (error) {
    console.error('createNote error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create note.' });
  }
};

// PUT /api/sticky-notes/:id — Update a single note
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['title', 'content', 'bgColor', 'textColor', 'isPinned', 'isCompleted', 'position'];
    
    // Build update object with only allowed fields
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Find and update, but ONLY if owned by the current user
    const note = await StickyNote.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found or not authorized.' });
    }

    res.json({ note });
  } catch (error) {
    console.error('updateNote error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update note.' });
  }
};

// DELETE /api/sticky-notes/:id — Delete a single note
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await StickyNote.findOneAndDelete({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found or not authorized.' });
    }

    res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('deleteNote error:', error);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
};

// DELETE /api/sticky-notes — Delete ALL notes for the logged-in user
const deleteAllNotes = async (req, res) => {
  try {
    const result = await StickyNote.deleteMany({ userId: req.user.id });
    res.json({ 
      message: `${result.deletedCount} note(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('deleteAllNotes error:', error);
    res.status(500).json({ error: 'Failed to delete notes.' });
  }
};

// PATCH /api/sticky-notes/reorder — Bulk update positions
const reorderNotes = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: 'orderedIds must be a non-empty array.' });
    }

    // Bulk write: each note gets a new position based on array index
    const bulkOps = orderedIds.map((noteId, index) => ({
      updateOne: {
        filter: { _id: noteId, userId: req.user.id },
        update: { $set: { position: index } },
      },
    }));

    await StickyNote.bulkWrite(bulkOps);
    res.json({ message: 'Notes reordered successfully.' });
  } catch (error) {
    console.error('reorderNotes error:', error);
    res.status(500).json({ error: 'Failed to reorder notes.' });
  }
};

// GET /api/sticky-notes/stats — Return note counts
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, pinned, completed] = await Promise.all([
      StickyNote.countDocuments({ userId }),
      StickyNote.countDocuments({ userId, isPinned: true }),
      StickyNote.countDocuments({ userId, isCompleted: true }),
    ]);

    res.json({ total, pinned, completed, max: MAX_NOTES_PER_USER });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

module.exports = {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  deleteAllNotes,
  reorderNotes,
  getStats,
};
