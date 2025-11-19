const mongoose = require('mongoose');

const wajibPajakSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  npwp: { type: String, required: true, unique: true },
  nomor_wa: { type: String, required: true },
  status: { type: String, enum: ['sudah', 'belum'], default: 'belum' }
}, { timestamps: true });

module.exports = mongoose.model('WajibPajak', wajibPajakSchema);
