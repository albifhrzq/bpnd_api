const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/WajibPajakController');
const WajibPajak = require('../models/WajibPajak');

// Setup multer (pakai memory storage supaya file tidak perlu disimpan ke disk)
const upload = multer({ storage: multer.memoryStorage() });

/* =========================
   ROUTES WAJIB PAJAK
========================= */

// Tambah data wajib pajak
router.post('/tambah', controller.tambahWajibPajak);

// Ambil semua data
router.get('/semua', controller.getSemuaWajibPajak);

// Ambil data berdasarkan ID (buat QR / StickerPage) - dengan debug log
router.get('/:id', (req, res, next) => {
  console.log('🔍 GET /:id called with ID:', req.params.id);
  
  // Validasi format MongoDB ObjectId
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    console.error('❌ Invalid MongoDB ObjectId format:', req.params.id);
    return res.status(400).json({ 
      message: 'Invalid ID format',
      receivedId: req.params.id,
      expectedFormat: '24 character hexadecimal string'
    });
  }
  
  console.log('✅ Valid ObjectId format');
  next();
}, controller.getWajibPajakById);

// Ambil data berdasarkan status
router.get('/status/belum', controller.getBelumLapor);
router.get('/status/sudah', controller.getSudahLapor);

// Blast WhatsApp
router.post('/blast', controller.kirimWaBlast);

// Update
router.put('/:id', (req, res, next) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
}, controller.updateWajibPajak);

// Delete
router.delete('/:id', (req, res, next) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
}, controller.deleteWajibPajak);

// Import dari Excel
router.post('/import', upload.single('file'), controller.importExcel);

module.exports = router;