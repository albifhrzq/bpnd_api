const { client } = require('../config/whatsapp');

const formatNumber = (no) => {
  if (no.startsWith('0')) return '62' + no.slice(1);
  if (no.startsWith('+')) return no.replace('+', '');
  return no;
};

exports.sendBlastMessage = async (req, res) => {
  const { message, numbers } = req.body;

  if (!message || !Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ message: 'Pesan dan daftar nomor wajib diisi.' });
  }

  const failed = [];
  const success = [];

  for (const no of numbers) {
    const raw = formatNumber(no);

    try {
      const numId = await client.getNumberId(raw);
      if (!numId) {
        console.log(`❌ ${raw} tidak terdaftar WA`);
        failed.push(raw);
        continue;
      }

      await client.sendMessage(numId._serialized, message);
      console.log(`✅ Pesan terkirim ke ${raw}`);
      success.push(raw);

    } catch (err) {
      console.error(`⚠️ Gagal kirim ke ${raw}:`, err.message);
      failed.push(raw);
    }
  }

  return res.json({
    message: 'Blast selesai.',
    total: numbers.length,
    sukses: success.length,
    gagal: failed.length,
    failed,
  });
};
