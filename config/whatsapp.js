// config/whatsapp.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

let qrCodeData = null;
let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "bapenda-wa-client"
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
  },
  // Force menggunakan versi WhatsApp Web yang stabil
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
  }
});

client.on('qr', async (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('🔁 Silakan scan QR code dengan WhatsApp kamu');
  
  // Generate QR code sebagai data URL untuk ditampilkan di frontend
  try {
    qrCodeData = await QRCode.toDataURL(qr);
    console.log('✅ QR code berhasil di-generate');
  } catch (err) {
    console.error('❌ Error generating QR code:', err);
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp client siap digunakan');
  isReady = true;
  qrCodeData = null; // Clear QR code setelah berhasil login
});

client.on('authenticated', () => {
  console.log('✅ WhatsApp authenticated');
  isReady = true;
});

client.on('auth_failure', (msg) => {
  console.error('❌ Gagal autentikasi WA:', msg);
  isReady = false;
});

client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp client disconnected:', reason);
  isReady = false;
  qrCodeData = null;
});

function initWhatsApp() {
  client.initialize();
}

function getQRCode() {
  return qrCodeData;
}

function getStatus() {
  // Periksa state client secara real-time
  const clientReady = client.info !== undefined && client.info !== null;
  return {
    isReady: isReady || clientReady,
    hasQRCode: qrCodeData !== null
  };
}

function getClientInfo() {
  try {
    if (client.info) {
      return {
        isConnected: true,
        phoneNumber: client.info.wid?.user || 'Unknown',
        platform: client.info.platform || 'Unknown'
      };
    }
  } catch (err) {
    console.error('Error getting client info:', err);
  }
  return {
    isConnected: false,
    phoneNumber: null,
    platform: null
  };
}

module.exports = {
  client,
  initWhatsApp,
  getQRCode,
  getStatus,
  getClientInfo
};
