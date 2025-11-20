// backend/routes/wa.js
const express = require('express');
const router = express.Router();
const { client, getQRCode, getStatus, getClientInfo } = require('../config/whatsapp');
const verifyToken = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/role');

// ===================
// GET /qrcode
// ===================
router.get('/qrcode', verifyToken, isSuperAdmin, (req, res) => {
  try {
    const status = getStatus();
    const qrCode = getQRCode();
    const clientInfo = getClientInfo();

    return res.json({
      isReady: status.isReady,
      hasQRCode: status.hasQRCode,
      qrCode: qrCode,
      clientInfo: clientInfo
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Error getting QR code',
      error: err.message
    });
  }
});

// ===================
// POST /blast
// ===================
router.post('/blast', verifyToken, isSuperAdmin, async (req, res) => {
  const { numbers, message } = req.body;

  console.log('📨 Blast request:', { numbers, messageLength: message?.length });

  if (!Array.isArray(numbers) || !message) {
    console.log('❌ Invalid payload');
    return res.status(400).json({ message: 'Format payload salah' });
  }

  // Cek state
  try {
    const state = await client.getState();
    console.log('📱 Client state:', state);
    if (state !== 'CONNECTED') {
      console.log('❌ Not connected');
      return res.status(503).json({
        message: 'WhatsApp belum terhubung. Silakan scan QR code terlebih dahulu.',
        state
      });
    }
  } catch (err) {
    console.error('❌ State check error:', err);
    return res.status(503).json({ message: 'WhatsApp client error. Silakan restart server.' });
  }

  const results = [];

  for (let i = 0; i < numbers.length; i++) {
    const rawNumber = numbers[i];
    let clean = rawNumber.replace(/[^0-9]/g, '');

    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    else if (!clean.startsWith('62')) clean = '62' + clean;

    const chatId = `${clean}@c.us`;
    console.log(`[${i+1}/${numbers.length}] 📤 Sending to ${chatId}...`);

    try {
      // LANGSUNG kirim tanpa getNumberId untuk avoid puppeteer error
      await client.sendMessage(chatId, message);
      console.log(`✅ Success: ${chatId}`);
      results.push({ number: rawNumber, status: 'success' });
    } catch (err) {
      console.error(`❌ Failed: ${chatId} -`, err.message);
      
      let errorMsg = err.message;
      if (errorMsg.includes('403') || errorMsg.includes('not registered')) {
        errorMsg = 'Nomor tidak terdaftar di WhatsApp';
      }
      
      results.push({
        number: rawNumber,
        status: 'failed',
        error: errorMsg
      });
    }

    if (i < numbers.length - 1) {
      console.log('⏳ Waiting 3 seconds...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  return res.json({
    message: 'Blast selesai',
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    }
  });
});

module.exports = router;
