// backend/routes/faceRoutes.js
const express = require('express');
const router = express.Router();
const faceController = require('../controllers/faceController');
const auth = require('../middleware/auth'); // pastikan middleware auth sudah ada

// ✅ Cek status wajah user (pakai JWT -> req.user.id)
router.get('/', auth, faceController.getFaceStatus);

// ✅ Daftar / update wajah user (pakai JWT + base64 image)
router.post('/register', auth, faceController.registerFace);

// ✅ Verifikasi wajah user (baru ditambah)
router.post('/verify', auth, faceController.verifyFace);

module.exports = router;
