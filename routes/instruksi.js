const express = require('express');
const router = express.Router();
const Instruksi = require('../models/Instruksi');
const auth = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

console.log('🔧 Loading Instruksi routes...');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/instruksi - Kirim instruksi (Admin/Superadmin)
router.post('/', 
  auth,
  [
    // Try both spellings
    body('instruksi')
      .optional()
      .isLength({ min: 5 })
      .withMessage('Instruksi minimal 5 karakter'),
    body('intruksi') // Typo version
      .optional()
      .isLength({ min: 5 })
      .withMessage('Intruksi minimal 5 karakter'),
    body('user')
      .isArray({ min: 1 })
      .withMessage('Minimal pilih 1 user penerima'),
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Format tanggal deadline tidak valid'),
    body('lokasi')
      .optional()
      .trim()
  ],
  // Custom validation for instruction text
  (req, res, next) => {
    console.log('🔍 RAW REQUEST BODY:', JSON.stringify(req.body, null, 2));
    
    // Get instruction text from either field
    const instruksiText = req.body.instruksi || req.body.intruksi;
    
    if (!instruksiText || !instruksiText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Instruksi wajib diisi'
      });
    }
    
    if (instruksiText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Instruksi minimal 5 karakter'
      });
    }
    
    // Normalize the field name to 'instruksi'
    req.body.instruksi = instruksiText.trim();
    
    console.log('✅ Instruction text validated:', instruksiText.substring(0, 50) + '...');
    next();
  },
  handleValidationErrors,
  async (req, res) => {
    console.log('📤 POST /api/instruksi - Create new instruction');
    
    try {
      const pengirimId = req.user.id;
      const { user, instruksi, deadline, lokasi, catatan } = req.body;

      console.log('📋 Final processed data:', { 
        userCount: user?.length || 0, 
        instruksi: instruksi ? instruksi.substring(0, 50) + '...' : 'MISSING!', 
        deadline, 
        lokasi,
        catatan,
        pengirimId 
      });

      // Double check required fields
      if (!user || !Array.isArray(user) || user.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Minimal pilih 1 user penerima'
        });
      }

      if (!instruksi || !instruksi.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Instruksi wajib diisi'
        });
      }

      // Create instructions for each selected user
      const instruksiData = user.map((userId) => ({
        user: userId,
        pengirim: pengirimId,
        instruksi: instruksi.trim(),
        deadline: deadline || null,
        lokasi: lokasi || null,
        catatan: catatan || null
      }));

      console.log('💾 Creating instructions for users:', user.length);
      const result = await Instruksi.insertMany(instruksiData);
      
      console.log('✅ Instructions created successfully:', result.length);
      
      res.status(201).json({ 
        success: true,
        message: `Instruksi berhasil dikirim ke ${result.length} petugas`,
        count: result.length,
        data: result
      });

    } catch (error) {
      console.error('❌ Error creating instructions:', error);
      res.status(500).json({ 
        success: false,
        message: 'Gagal mengirim instruksi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);
// GET /api/instruksi - Get all instructions (Admin/Superadmin)
router.get('/', auth, async (req, res) => {
  console.log('📤 GET /api/instruksi - Get all instructions');
  
  try {
    const { status, user, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = {};
    if (status) query.status = status;
    if (user) query.user = user;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const instructions = await Instruksi.find(query)
      .populate('user', 'nama jabatan')
      .populate('pengirim', 'nama jabatan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Instruksi.countDocuments(query);
    
    console.log('✅ Instructions found:', instructions.length, 'of', total);
    
    res.json({
      success: true,
      data: instructions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching all instructions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data instruksi',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/instruksi/me - Get my instructions
router.get('/me', auth, async (req, res) => {
  console.log('📤 GET /api/instruksi/me - Get my instructions');
  console.log('User ID from token:', req.user.id);
  
  try {
    const { status } = req.query;
    
    // Build query
    let query = { user: req.user.id };
    if (status) query.status = status;

    const myInstructions = await Instruksi.find(query)
      .populate('pengirim', 'nama jabatan')
      .sort({ createdAt: -1 });
    
    console.log('✅ My instructions found:', myInstructions.length);
    
    res.json({
      success: true,
      data: myInstructions,
      count: myInstructions.length
    });

  } catch (error) {
    console.error('❌ Error fetching my instructions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil instruksi Anda',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/instruksi/user/:userId - Get instructions for specific user
router.get('/user/:userId', 
  auth,
  [
    param('userId')
      .isMongoId()
      .withMessage('User ID tidak valid')
  ],
  handleValidationErrors,
  async (req, res) => {
    console.log('📤 GET /api/instruksi/user/:userId - Get user instructions');
    console.log('Target User ID:', req.params.userId);
    
    try {
      const { status } = req.query;
      
      // Build query
      let query = { user: req.params.userId };
      if (status) query.status = status;

      const userInstructions = await Instruksi.find(query)
        .populate('pengirim', 'nama jabatan')
        .sort({ createdAt: -1 });
      
      console.log('✅ User instructions found:', userInstructions.length);
      
      res.json({
        success: true,
        data: userInstructions,
        count: userInstructions.length
      });

    } catch (error) {
      console.error('❌ Error fetching user instructions:', error);
      res.status(500).json({ 
        success: false,
        message: 'Gagal mengambil instruksi user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// PUT /api/instruksi/:id/status - Update instruction status
router.put('/:id/status', 
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Instruction ID tidak valid'),
    body('status')
      .isIn(['Tugas Diberikan', 'Sedang Dikerjakan', 'Selesai'])
      .withMessage('Status tidak valid')
  ],
  handleValidationErrors,
  async (req, res) => {
    console.log('📤 PUT /api/instruksi/:id/status - Update status');
    console.log('Instruction ID:', req.params.id);
    console.log('New status:', req.body.status);
    
    try {
      const { status } = req.body;
      
      const instruksi = await Instruksi.findByIdAndUpdate(
        req.params.id,
        { 
          status,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('pengirim', 'nama jabatan');

      if (!instruksi) {
        return res.status(404).json({ 
          success: false,
          message: 'Instruksi tidak ditemukan' 
        });
      }

      // Check if user has permission to update this instruction
      if (instruksi.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ 
          success: false,
          message: 'Anda tidak memiliki akses untuk mengupdate instruksi ini' 
        });
      }

      console.log('✅ Status updated successfully:', status);
      
      res.json({
        success: true,
        message: 'Status berhasil diupdate',
        data: instruksi
      });

    } catch (error) {
      console.error('❌ Error updating status:', error);
      res.status(500).json({ 
        success: false,
        message: 'Gagal mengupdate status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// PUT /api/instruksi/:id - Update full instruction (Admin only)
router.put('/:id',
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Instruction ID tidak valid'),
    body('instruksi')
      .optional()
      .isLength({ min: 5 })
      .withMessage('Instruksi minimal 5 karakter'),
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Format tanggal deadline tidak valid')
  ],
  handleValidationErrors,
  async (req, res) => {
    console.log('📤 PUT /api/instruksi/:id - Update instruction');
    
    try {
      // Check admin permission
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ 
          success: false,
          message: 'Hanya admin yang dapat mengupdate instruksi' 
        });
      }

      const updateData = {};
      if (req.body.instruksi) updateData.instruksi = req.body.instruksi;
      if (req.body.lokasi) updateData.lokasi = req.body.lokasi;
      if (req.body.deadline) updateData.deadline = req.body.deadline;
      if (req.body.catatan) updateData.catatan = req.body.catatan;

      const instruksi = await Instruksi.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      )
      .populate('user', 'nama jabatan')
      .populate('pengirim', 'nama jabatan');

      if (!instruksi) {
        return res.status(404).json({ 
          success: false,
          message: 'Instruksi tidak ditemukan' 
        });
      }

      console.log('✅ Instruction updated successfully');
      
      res.json({
        success: true,
        message: 'Instruksi berhasil diupdate',
        data: instruksi
      });

    } catch (error) {
      console.error('❌ Error updating instruction:', error);
      res.status(500).json({ 
        success: false,
        message: 'Gagal mengupdate instruksi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// DELETE /api/instruksi/:id - Delete instruction (Admin only)
router.delete('/:id',
  auth,
  [
    param('id')
      .isMongoId()
      .withMessage('Instruction ID tidak valid')
  ],
  handleValidationErrors,
  async (req, res) => {
    console.log('📤 DELETE /api/instruksi/:id - Delete instruction');
    
    try {
      // Check admin permission
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ 
          success: false,
          message: 'Hanya admin yang dapat menghapus instruksi' 
        });
      }

      const instruksi = await Instruksi.findByIdAndDelete(req.params.id);

      if (!instruksi) {
        return res.status(404).json({ 
          success: false,
          message: 'Instruksi tidak ditemukan' 
        });
      }

      console.log('✅ Instruction deleted successfully');
      
      res.json({
        success: true,
        message: 'Instruksi berhasil dihapus'
      });

    } catch (error) {
      console.error('❌ Error deleting instruction:', error);
      res.status(500).json({ 
        success: false,
        message: 'Gagal menghapus instruksi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// GET /api/instruksi/test - Test endpoint
router.get('/test', (req, res) => {
  console.log('📤 GET /api/instruksi/test - Test endpoint');
  
  res.json({ 
    success: true,
    message: 'Instruksi routes working perfectly!', 
    timestamp: new Date(),
    endpoints: [
      'POST /api/instruksi - Create instruction',
      'GET /api/instruksi - Get all instructions', 
      'GET /api/instruksi/me - Get my instructions',
      'GET /api/instruksi/user/:userId - Get user instructions',
      'PUT /api/instruksi/:id/status - Update status',
      'PUT /api/instruksi/:id - Update instruction (admin)',
      'DELETE /api/instruksi/:id - Delete instruction (admin)',
      'GET /api/instruksi/test - Test endpoint'
    ]
  });
});

console.log('✅ Instruksi routes loaded successfully');
module.exports = router;