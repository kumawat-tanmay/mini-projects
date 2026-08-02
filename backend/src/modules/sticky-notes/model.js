const mongoose = require('mongoose');

const stickyNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: '',
    maxlength: 100,
    trim: true,
  },
  content: {
    type: String,
    default: '',
    maxlength: 2000,
    trim: true,
  },
  bgColor: {
    type: String,
    default: '#FACC15',
    validate: {
      validator: (v) => /^#([0-9A-Fa-f]{6})$/.test(v),
      message: 'bgColor must be a valid 6-digit hex color (e.g. #FACC15)',
    },
  },
  textColor: {
    type: String,
    default: '#000000',
    validate: {
      validator: (v) => /^#([0-9A-Fa-f]{6})$/.test(v),
      message: 'textColor must be a valid 6-digit hex color (e.g. #000000)',
    },
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Number,
    default: () => Date.now(),
  },
}, { timestamps: true });

// Compound index for fast sorted queries scoped to a user (matches newest/default sort)
stickyNoteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('StickyNote', stickyNoteSchema);
