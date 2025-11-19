const { client } = require('../config/whatsapp');

function formatPhoneNumber(number) {
  if (number.startsWith('08')) {
    return '62' + number.slice(1);
  }
  return number;
}

function sendStatusNotification(number, laporan) {
  console.log(`📤 Mengirim notifikasi ke ${number}...`);

  const message = `📄 *Notifikasi Status Laporan*\n\n` +
    `🆔 ID Laporan: ${laporan._id}\n` +
    `📝 Judul: ${laporan.judul}\n` +
    `📅 Tanggal: ${new Date(laporan.createdAt).toLocaleDateString()}\n` +
    `📌 Status terbaru: *${laporan.status.toUpperCase()}*`;

  const rawNumber = formatPhoneNumber(number);
  const waNumber = rawNumber.includes('@c.us') ? rawNumber : `${rawNumber}@c.us`;

  if (!client.info) {
    console.error('❌ WhatsApp client belum siap!');
    return;
  }

  client.sendMessage(waNumber, message)
    .then(() => {
      console.log(`✅ Notifikasi dikirim ke ${waNumber}`);
    })
    .catch(err => {
      console.error(`❌ Gagal kirim notifikasi ke ${waNumber}:`, err.message);
    });
}

module.exports = sendStatusNotification;
