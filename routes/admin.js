// backend/routes/admin.js - File ini WAJIB ada!
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const User = require('../models/User');
const Laporan = require('../models/Laporan');
const Log = require('../models/Log');

// GET /api/admin/stats
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    console.log('GET /api/admin/stats called by user:', req.user.id);
    
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalLaporan = await Laporan.countDocuments();
    const laporanBaru = await Laporan.countDocuments({ status: 'Belum Dicek' });
    const laporanDiproses = await Laporan.countDocuments({ 
      status: { $in: ['Disetujui', 'Ditolak'] } 
    });
    
    const statsData = { 
      totalUsers, 
      totalLaporan, 
      laporanBaru, 
      laporanDiproses 
    };
    
    console.log('Stats data:', statsData);
    res.json(statsData);
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET /api/admin/recent-laporan
router.get('/recent-laporan', auth, isAdmin, async (req, res) => {
  try {
    console.log('GET /api/admin/recent-laporan called by user:', req.user.id);
    
    const laporan = await Laporan.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'nama username')
      .lean(); // Gunakan lean() untuk performance
    
    console.log('Recent laporan data:', laporan);
    console.log('Recent laporan count:', laporan.length);
    
    // PASTIKAN SELALU RETURN ARRAY
    res.json(Array.isArray(laporan) ? laporan : []);
  } catch (err) {
    console.error('Error getting recent laporan:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: err.message,
      data: [] // SELALU RETURN EMPTY ARRAY SAAT ERROR
    });
  }
});

// GET /api/admin/laporan - Untuk semua laporan di halaman admin
router.get('/laporan', auth, isAdmin, async (req, res) => {
  try {
    console.log('GET /api/admin/laporan called by user:', req.user.id);
    
    const laporan = await Laporan.find()
      .populate('user', 'nama username jabatan')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('All admin laporan data:', laporan);
    console.log('All admin laporan count:', laporan.length);
    
    // PASTIKAN SELALU RETURN ARRAY
    res.json(Array.isArray(laporan) ? laporan : []);
  } catch (err) {
    console.error('Error getting all admin laporan:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: err.message,
      data: [] // SELALU RETURN EMPTY ARRAY SAAT ERROR
    });
  }
});

module.exports = router;