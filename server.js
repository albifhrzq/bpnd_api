require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const { initWhatsApp } = require('./config/whatsapp');

const app = express();

// Connect to database
connectDB();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));// penting untuk base64 Face ID
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize WhatsApp
console.log('Initializing WhatsApp client...');
initWhatsApp();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const laporanRoutes = require('./routes/laporan');
const superadminRoutes = require('./routes/superadmin');
const adminRoutes = require('./routes/admin');
const whatsappRoutes = require('./routes/wa');
const wajibPajakRoutes = require('./routes/wajibpajak');
const instruksiRoutes = require('./routes/instruksi');
const userSimpleRoutes = require('./routes/user');
const faceRoutes = require('./routes/faceRoutes'); // 👈 tambahin ini

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/wajibpajak', wajibPajakRoutes);
app.use('/api/instruksi', instruksiRoutes);
app.use('/api/user-simple', userSimpleRoutes);
app.use('/api/face', faceRoutes); // 👈 tambahin ini

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running successfully! 🚀',
    timestamp: new Date(),
    routes: [
      '/api/auth',
      '/api/users',
      '/api/laporan', 
      '/api/superadmin',
      '/api/admin',
      '/api/whatsapp',
      '/api/wajibpajak',
      '/api/instruksi',
      '/api/user-simple',
      '/api/face' // 👈 tambahin ini
    ]
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend connected successfully!',
    timestamp: new Date()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack || err);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'POST /api/instruksi - Create instruction',
      'GET /api/instruksi - Get all instructions',
      'GET /api/instruksi/me - Get my instructions',
      'GET /api/instruksi/user/:userId - Get instructions for specific user',
      'PUT /api/instruksi/:id/status - Update instruction status'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log('✅ All routes mounted successfully');
});
