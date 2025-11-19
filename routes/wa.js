// backend/routes/wa.js
const express = require('express');
const router = express.Router();
const { client } = require('../config/whatsapp'); // s
// udah ada file whatsapp.js


router.post('/blast', async (req, res) => {
  const { numbers, message } = req.body;

  if (!Array.isArray(numbers) || !message) {
    return res.status(400).json({ message: 'Format payload salah' });
  }

  const results = [];

  for (let number of numbers) {
    const formatted = number.includes('@c.us') ? number : `${number}@c.us`;
    try {
      await client.sendMessage(formatted, message);
      results.push({ number, status: 'success' });
    } catch (err) {
      results.push({ number, status: 'failed', error: err.message });
    }
  }

  return res.status(200).json({
    message: 'Blast selesai',
    results
  });
});

module.exports = router;
