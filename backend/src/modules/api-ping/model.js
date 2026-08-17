const mongoose = require('mongoose');

const apiRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: 'New Request',
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      default: 'GET',
    },
    headers: {
      type: [{
        key: { type: String, default: '' },
        value: { type: String, default: '' }
      }],
      default: [],
    },
    body: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiRequest', apiRequestSchema);
