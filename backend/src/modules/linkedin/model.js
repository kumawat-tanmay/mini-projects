const mongoose = require('mongoose');

const postHistorySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  postUrn: {
    type: String,
    default: '',
  },
  postUrl: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const aiKeysSchema = new mongoose.Schema(
  {
    gemini: {
      type: String,
      default: '',
    },
    openai: {
      type: String,
      default: '',
    },
    groq: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const linkedinConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    accessToken: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
    },
    linkedinId: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    picture: {
      type: String,
      default: '',
    },
    // Encrypted API keys per AI provider (AES-256-GCM ciphertext, never plaintext)
    aiKeys: {
      type: aiKeysSchema,
      default: () => ({}),
    },
    // Which AI provider to use by default for post generation
    defaultProvider: {
      type: String,
      default: 'gemini',
      enum: ['gemini', 'openai', 'groq'],
    },
    postHistory: [postHistorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('LinkedinConnection', linkedinConnectionSchema);
