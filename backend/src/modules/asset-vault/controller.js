const Asset = require('./model');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// GET /api/assets — List all assets for logged-in user
const getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/assets — Upload an asset
const uploadAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Asset.countDocuments({ userId });
    
    if (count >= 20) {
      return res.status(403).json({ error: 'Limit is completed, cant add more' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, size, buffer } = req.file;

    // Check size limit (e.g. 10MB)
    const MAX_SIZE = parseInt(process.env.MAX_IMAGE_SIZE_MB || '10') * 1024 * 1024;
    if (size > MAX_SIZE) {
      return res.status(400).json({ error: `File size exceeds limit of ${process.env.MAX_IMAGE_SIZE_MB}MB` });
    }

    // Wrap Cloudinary upload in a promise
    const uploadStream = () => {
      return new Promise((resolve, reject) => {
        const isRaw = originalname.toLowerCase().endsWith('.pdf') || originalname.toLowerCase().endsWith('.zip');
        const cld_upload_stream = cloudinary.uploader.upload_stream(
          {
            folder: process.env.CLOUDINARY_FOLDER_NAME || 'MINI_PROJECTS',
            resource_type: isRaw ? 'raw' : 'auto', 
            use_filename: true,
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(buffer).pipe(cld_upload_stream);
      });
    };

    const uploadResult = await uploadStream();

    const asset = new Asset({
      userId: req.user.id,
      name: originalname,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format || 'raw', // Sometimes PDFs return as raw
      size: uploadResult.bytes || size,
    });

    const savedAsset = await asset.save();
    res.status(201).json({ asset: savedAsset });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
};

// DELETE /api/assets/:id — Delete an asset
const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, userId: req.user.id });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Delete from Cloudinary
    // Note: resource_type might need to be specified if it's raw vs image
    // Cloudinary usually defaults to 'image' for images.
    const resourceType = ['pdf', 'zip', 'raw'].includes(asset.format) ? 'raw' : 'image';
    await cloudinary.uploader.destroy(asset.publicId, { resource_type: resourceType });

    // Delete from DB
    await Asset.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
};

module.exports = {
  getAllAssets,
  uploadAsset,
  deleteAsset
};
