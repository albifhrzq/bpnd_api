const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const { getMe, updateUser, changePassword, getAllUsers, getUserById } = require('../controllers/userController');
const Laporan = require('../models/Laporan');
const User = require('../models/User');

router.get('/me', auth, getMe);
router.put('/me', auth, updateUser);
router.put('/me/password', auth, changePassword);

router.get('/', auth, isAdmin, getAllUsers);
router.get('/:id', auth, isAdmin, getUserById);

// TAMBAHKAN ENDPOINT INI UNTUK BLAST WHATSAPP
// Tambahkan endpoint ini di backend/routes/users.js
// WAJIB: Tambahkan ini di routes/users.js
// WA Users Endpoint - final versi
router.get('/wa-users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({
      whatsappNumber: { $exists: true, $ne: null, $ne: '' },
      status: 'aktif'
    }).select('nama whatsappNumber');

    const formattedUsers = users.map(user => ({
      name: user.nama,
      phone: user.whatsappNumber,
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error('WA USERS ERROR:', err);
    res.status(500).json({
      msg: 'Server error',
      error: err.message,
      stack: err.stack
    });
  }
});



// Endpoint stats admin
router.get('/admin/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLaporan = await Laporan.countDocuments();
    const laporanBaru = await Laporan.countDocuments({ status: 'Belum Dicek' });
    res.json({ totalUsers, totalLaporan, laporanBaru });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Endpoint recent laporan
router.get('/admin/recent-laporan', auth, isAdmin, async (req, res) => {
  try {
    const Laporan = require('../models/Laporan');
    const recent = await Laporan.find().sort({ createdAt: -1 }).limit(5).populate('user', 'nama username jabatan');
    res.json(recent);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// TEMPORARY - test endpoint tanpa auth
router.get('/test-wa', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const User = require('../models/User');
    
    const userCount = await User.countDocuments();
    console.log('Total users:', userCount);
    
    const usersWithWA = await User.countDocuments({ 
      whatsappNumber: { $exists: true, $ne: null, $ne: '' } 
    });
    console.log('Users with WhatsApp:', usersWithWA);
    
    res.json({ 
      message: 'Test berhasil',
      totalUsers: userCount,
      usersWithWhatsApp: usersWithWA
    });
  } catch (err) {
    console.error('Test error:', err);
    res.status(500).json({ msg: 'Test error', error: err.message });
  }
});

module.exports = router;