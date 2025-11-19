require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

console.log('Express version:', require('express/package.json').version);

connectDB();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

console.log('🚀 Testing routes one by one...');

// Test basic route first
app.get('/', (req, res) => {
  res.json({ message: 'Server working!' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test route working!', timestamp: new Date() });
});

// Test routes one by one - COMMENT OUT PROBLEMATIC ONES
try {
  console.log('1. Loading auth...');
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ Auth OK');
} catch (e) { console.error('❌ Auth failed:', e.message); }

try {
  console.log('2. Loading users...');
  app.use('/api/users', require('./routes/users'));
  console.log('✅ Users OK');
} catch (e) { console.error('❌ Users failed:', e.message); }

try {
  console.log('3. Loading admin...');
  app.use('/api/admin', require('./routes/admin'));
  console.log('✅ Admin OK');
} catch (e) { console.error('❌ Admin failed:', e.message); }

try {
  console.log('4. Loading superadmin...');
  app.use('/api/superadmin', require('./routes/superadmin'));
  console.log('✅ Superadmin OK');
} catch (e) { console.error('❌ Superadmin failed:', e.message); }

try {
  console.log('5. Loading wa...');
  app.use('/api/wa', require('./routes/wa'));
  console.log('✅ WA OK');
} catch (e) { console.error('❌ WA failed:', e.message); }

// NOW TEST THE PROBLEMATIC ROUTES ONE BY ONE
try {
  console.log('6. Loading laporan...');
  app.use('/api/laporan', require('./routes/laporan'));
  console.log('✅ Laporan OK');
} catch (e) { console.error('❌ Laporan failed:', e.message); }

try {
  console.log('7. Loading wajibpajak...');
  app.use('/wajibpajak', require('./routes/wajibpajak'));
  console.log('✅ Wajibpajak OK');
} catch (e) { console.error('❌ Wajibpajak failed:', e.message); }

try {
  console.log('8. Loading instruksi...');
  app.use('/api/instruksi', require('./routes/instruksi'));
  console.log('✅ Instruksi OK');
} catch (e) { console.error('❌ Instruksi failed:', e.message); }

console.log('🎉 Basic routes loaded, testing server startup...');

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log('Visit http://localhost:3001/test to verify');
});