const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      required: true, // e.g. 'pdf', 'png', 'jpg'
    },
    size: {
      type: Number,
      required: true, // in bytes
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Asset', assetSchema);
