const Prompt = require('./model');
const { PDFParse } = require('pdf-parse');

// GET /api/prompt-store — List all prompts for logged-in user
const getAllPrompts = async (req, res) => {
  try {
    const prompts = await Prompt.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/prompt-store — Create a new prompt
const createPrompt = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Prompt.countDocuments({ userId });
    
    if (count >= 30) {
      return res.status(403).json({ error: 'Limit is completed, cant add more' });
    }

    const { title, content, tags } = req.body;
    const prompt = new Prompt({
      userId,
      title: title || '',
      content: content || '',
      tags: tags || [],
    });
    const savedPrompt = await prompt.save();
    res.status(201).json({ prompt: savedPrompt });
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/prompt-store/:id — Update a prompt
const updatePrompt = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const prompt = await Prompt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { title, content, tags } },
      { new: true }
    );
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json({ prompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/prompt-store/:id — Delete a prompt
const deletePrompt = async (req, res) => {
  try {
    const prompt = await Prompt.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json({ message: 'Prompt deleted' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/prompt-store — Delete ALL prompts
const deleteAllPrompts = async (req, res) => {
  try {
    const result = await Prompt.deleteMany({ userId: req.user.id });
    res.json({
      message: `${result.deletedCount} prompt(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all prompts:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/prompt-store/extract — Extract text from uploaded file
const extractTextFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const originalName = file.originalname;
    let extractedText = '';

    if (file.mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: file.buffer });
      const data = await parser.getText();
      extractedText = data.text;
    } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown' || originalName.endsWith('.md')) {
      extractedText = file.buffer.toString('utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF, TXT, or MD files.' });
    }

    const title = originalName.split('.').slice(0, -1).join('.') || originalName;
    const prompt = {
      title: title,
      content: extractedText.trim(),
    };
    
    res.status(200).json({ prompt });

  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
};

module.exports = {
  getAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  deleteAllPrompts,
  extractTextFromFile
};
