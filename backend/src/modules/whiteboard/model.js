const mongoose = require('mongoose');

const whiteboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Untitled Board',
      trim: true,
      maxlength: 100,
    },
    canvasData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index for fast user board queries sorted by most recently modified
whiteboardSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
