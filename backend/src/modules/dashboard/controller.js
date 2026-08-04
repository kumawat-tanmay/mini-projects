const mongoose = require('mongoose');
const Note = require('../sticky-notes/model');
const Prompt = require('../prompt-store/model');
const Asset = require('../asset-vault/model');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [noteStatsData, promptStatsData, assetStatsData] = await Promise.all([
      // 1. Sticky Notes Stats
      Note.aggregate([
        { $match: { userId } },
        {
          $facet: {
            total: [{ $count: "count" }],
            completed: [{ $match: { completed: true } }, { $count: "count" }],
            pinned: [{ $match: { pinned: true } }, { $count: "count" }]
          }
        }
      ]),

      // 2. Prompt Store Stats
      Prompt.aggregate([
        { $match: { userId } },
        {
          $facet: {
            total: [{ $count: "count" }]
          }
        }
      ]),

      // 3. Asset Vault Stats
      Asset.aggregate([
        { $match: { userId } },
        {
          $facet: {
            total: [{ $count: "count" }],
            totalSize: [{ $group: { _id: null, totalStorage: { $sum: "$size" } } }]
          }
        }
      ])
    ]);

    // Format Notes Stats
    const ns = noteStatsData[0];
    const notes = {
      total: ns.total[0]?.count || 0,
      completed: ns.completed[0]?.count || 0,
      pinned: ns.pinned[0]?.count || 0,
    };

    // Format Prompts Stats
    const ps = promptStatsData[0];
    const prompts = {
      total: ps.total[0]?.count || 0,
    };

    // Format Assets Stats
    const as = assetStatsData[0];
    const assets = {
      total: as.total[0]?.count || 0,
      totalStorageBytes: as.totalSize[0]?.totalStorage || 0,
    };

    res.json({ notes, prompts, assets });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: 'Server error fetching dashboard statistics' });
  }
};

module.exports = {
  getDashboardStats
};
