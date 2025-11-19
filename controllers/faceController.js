const fs = require('fs');
const path = require('path');
const User = require('../models/User');

exports.getFaceStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ registered: false });
    }
    res.json({ registered: !!user.faceImage });
  } catch (err) {
    console.error('❌ Error getFaceStatus:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.registerFace = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // decode base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // pastikan folder ada
    const filePath = path.join(__dirname, '..', 'uploads', 'faces');
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    // simpan file
    const fileName = `face_${req.user.id}_${Date.now()}.jpg`;
    const fullPath = path.join(filePath, fileName);
    fs.writeFileSync(fullPath, buffer);

    // update field user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { faceImage: `/uploads/faces/${fileName}` },
      { new: true }
    );

    res.json({ success: true, message: 'Face registered successfully', user });
  } catch (err) {
    console.error('❌ Error registerFace:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyFace = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.faceImage) {
      return res.status(404).json({ message: 'Face not registered' });
    }

    // ❗ Versi basic:
    // cukup cek apakah user sudah punya foto wajah tersimpan.
    // kalau mau advanced, di sini lakukan face-recognition (compare wajah baru vs wajah lama).

    res.json({ success: true, message: 'Face verified' });
  } catch (err) {
    console.error('❌ Error verifyFace:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 

// userController.js
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpires');
    res.json(users);
  } catch (err) {
    console.error('❌ Error getAllUsers:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

