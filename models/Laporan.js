const mongoose = require('mongoose');

const LaporanSchema = new mongoose.Schema({
  nama_merk: { type: String, required: true },
  npwpd: { type: String, required: true },
  alamat: { type: String, required: true },
  hasil_pemeriksaan: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Status lebih detail
  status: {
    type: String,
    enum: [
      'Tugas Diberikan',
      'Sedang Dikerjakan',
      'Menunggu Verifikasi',
      'Disetujui',
      'Ditolak'
    ],
    default: 'Tugas Diberikan'
  },

  komentarAdmin: { type: String }, // Khusus untuk penolakan atau feedback admin
  tanggal: { type: Date, default: Date.now },

  // Bukti lapangan
  foto: [{ type: String }],
  latitude: { type: Number },
  longitude: { type: Number },

  // Log perubahan status
  history: [
    {
      status: { type: String },
      waktu: { type: Date, default: Date.now },
      oleh: { type: String } // "admin" atau "user"
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Laporan', LaporanSchema);
