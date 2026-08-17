const User = require('../../models/User');

exports.getFocusMix = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    // Return focusMix, fallback to default 0s if empty
    res.json(user.focusMix || { rain: 0, cafe: 0, noise: 0, keyboard: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch focus mix.' });
  }
};

exports.updateFocusMix = async (req, res) => {
  try {
    const { rain, cafe, noise, keyboard } = req.body;
    
    const update = {};
    if (rain !== undefined) update['focusMix.rain'] = Number(rain);
    if (cafe !== undefined) update['focusMix.cafe'] = Number(cafe);
    if (noise !== undefined) update['focusMix.noise'] = Number(noise);
    if (keyboard !== undefined) update['focusMix.keyboard'] = Number(keyboard);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user.focusMix);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update focus mix.' });
  }
};
