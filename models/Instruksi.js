const mongoose = require('mongoose');

const instruksiSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  pengirim: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  instruksi: { 
    type: String, 
    required: [true, 'Instruksi wajib diisi'],
    trim: true 
  },
  lokasi: { 
    type: String,
    trim: true,
    default: null 
  },
  deadline: { 
    type: Date,
    default: null 
  },
  status: {
    type: String,
    enum: ['Tugas Diberikan', 'Sedang Dikerjakan', 'Selesai'],
    default: 'Tugas Diberikan',
  },
  catatan: {
    type: String,
    trim: true,
    default: null
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index untuk query yang sering digunakan
instruksiSchema.index({ user: 1, createdAt: -1 });
instruksiSchema.index({ pengirim: 1, createdAt: -1 });
instruksiSchema.index({ status: 1 });

// Virtual untuk format deadline yang user-friendly
instruksiSchema.virtual('deadlineFormatted').get(function() {
  return this.deadline ? this.deadline.toLocaleDateString('id-ID') : null;
});

// Virtual untuk menghitung apakah deadline sudah lewat
instruksiSchema.virtual('isOverdue').get(function() {
  return this.deadline && new Date() > this.deadline && this.status !== 'Selesai';
});

// Method untuk update status
instruksiSchema.methods.updateStatus = function(newStatus) {
  const validStatuses = ['Tugas Diberikan', 'Sedang Dikerjakan', 'Selesai'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Status tidak valid');
  }
  this.status = newStatus;
  return this.save();
};

// Static method untuk mendapatkan instruksi berdasarkan user
instruksiSchema.statics.getByUser = function(userId) {
  return this.find({ user: userId })
    .populate('pengirim', 'nama jabatan')
    .sort({ createdAt: -1 });
};

// Static method untuk mendapatkan instruksi berdasarkan pengirim
instruksiSchema.statics.getBySender = function(senderId) {
  return this.find({ pengirim: senderId })
    .populate('user', 'nama jabatan')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Instruksi', instruksiSchema);