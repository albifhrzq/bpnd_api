// config/whatsapp.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox'],
  },
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('🔁 Silakan scan QR code dengan WhatsApp kamu');
});

client.on('ready', () => {
  console.log('✅ WhatsApp client siap digunakan');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Gagal autentikasi WA:', msg);
});

client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp client disconnected:', reason);
});

function initWhatsApp() {
  client.initialize();
}

module.exports = {
  client,
  initWhatsApp
};
