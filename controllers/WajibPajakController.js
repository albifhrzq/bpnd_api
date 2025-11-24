const WajibPajak = require('../models/WajibPajak');
const { client } = require('../config/whatsapp');
const XLSX = require("xlsx");

// Tambah data wajib pajak
exports.tambahWajibPajak = async (req, res) => {
  try {
    const data = await WajibPajak.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ambil semua data wajib pajak
exports.getSemuaWajibPajak = async (req, res) => {
  try {
    const data = await WajibPajak.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ambil data berdasarkan ID - dengan debug yang lebih detail
exports.getWajibPajakById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Controller getWajibPajakById called');
    console.log('📝 Received ID:', id);
    console.log('📏 ID length:', id.length);
    console.log('🔤 ID type:', typeof id);

    // Validasi format ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('❌ Invalid ObjectId format in controller');
      return res.status(400).json({ 
        message: 'Invalid ID format',
        receivedId: id,
        idLength: id.length
      });
    }

    console.log('✅ ObjectId format valid, querying database...');

    const data = await WajibPajak.findById(id);
    
    if (!data) {
      console.error('❌ No data found for ID:', id);
      return res.status(404).json({ 
        message: 'Wajib Pajak tidak ditemukan',
        searchedId: id
      });
    }

    console.log('✅ Data found:', {
      id: data._id,
      nama: data.nama,
      npwp: data.npwp
    });

    res.json(data);
  } catch (err) {
    console.error('💥 Error getWajibPajakById:', err);
    res.status(500).json({ 
      message: 'Gagal mengambil data wajib pajak',
      error: err.message,
      receivedId: req.params.id
    });
  }
};

// Ambil yang belum lapor
exports.getBelumLapor = async (req, res) => {
  try {
    const data = await WajibPajak.find({ status: 'belum' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ambil yang sudah lapor
exports.getSudahLapor = async (req, res) => {
  try {
    const data = await WajibPajak.find({ status: 'sudah' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fungsi bantu format nomor WA
const formatNumber = (no) => {
  if (no.startsWith('0')) return '62' + no.slice(1);
  if (no.startsWith('+')) return no.replace('+', '');
  return no;
};

// Kirim pesan WA blast
exports.kirimWaBlast = async (req, res) => {
  try {
    const { message, ids } = req.body;

    console.log('📨 WA Blast request:', { ids: ids?.length, messageLength: message?.length });

    if (!ids || ids.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang dipilih.' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Pesan tidak boleh kosong.' });
    }

    // Cek status WhatsApp client
    try {
      const state = await client.getState();
      console.log('📱 Client state:', state);
      if (state !== 'CONNECTED') {
        return res.status(503).json({
          message: 'WhatsApp belum terhubung. Silakan scan QR code terlebih dahulu.',
          state
        });
      }
    } catch (err) {
      console.error('❌ State check error:', err);
      return res.status(503).json({ message: 'WhatsApp client error. Silakan restart server.' });
    }

    // Ambil data wajib pajak
    const data = await WajibPajak.find({ _id: { $in: ids } });
    
    if (data.length === 0) {
      return res.status(404).json({ message: 'Data wajib pajak tidak ditemukan.' });
    }

    const results = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const rawNumber = item.nomor_wa;
      
      if (!rawNumber) {
        console.log(`⚠️ [${i+1}/${data.length}] ${item.nama} tidak punya nomor WA`);
        results.push({
          nama: item.nama,
          nomor: '-',
          status: 'failed',
          error: 'Nomor WA tidak tersedia'
        });
        continue;
      }

      let clean = rawNumber.replace(/[^0-9]/g, '');
      if (clean.startsWith('0')) clean = '62' + clean.slice(1);
      else if (!clean.startsWith('62')) clean = '62' + clean;

      const chatId = `${clean}@c.us`;
      console.log(`[${i+1}/${data.length}] 📤 Sending to ${item.nama} (${chatId})...`);

      try {
        await client.sendMessage(chatId, message);
        console.log(`✅ Success: ${item.nama}`);
        results.push({
          nama: item.nama,
          nomor: rawNumber,
          status: 'success'
        });
      } catch (err) {
        console.error(`❌ Failed: ${item.nama} -`, err.message);
        
        let errorMsg = err.message;
        if (errorMsg.includes('403') || errorMsg.includes('not registered')) {
          errorMsg = 'Nomor tidak terdaftar di WhatsApp';
        }
        
        results.push({
          nama: item.nama,
          nomor: rawNumber,
          status: 'failed',
          error: errorMsg
        });
      }

      // Delay 2 detik antar pesan (kecuali pesan terakhir)
      if (i < data.length - 1) {
        console.log('⏳ Waiting 2 seconds...');
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    };

    console.log('📊 Summary:', summary);

    return res.json({
      message: `Blast selesai: ${summary.success} berhasil, ${summary.failed} gagal`,
      results,
      summary
    });
  } catch (err) {
    console.error('💥 Error kirim WA blast:', err.message);
    return res.status(500).json({ message: 'Terjadi kesalahan saat mengirim pesan', error: err.message });
  }
};

// Update data wajib pajak
exports.updateWajibPajak = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await WajibPajak.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    res.json({ message: 'Berhasil mengupdate data', data: updated });
  } catch (error) {
    console.error('Gagal update:', error);
    res.status(500).json({ message: 'Gagal mengupdate data', error });
  }
};

// Hapus data wajib pajak
exports.deleteWajibPajak = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await WajibPajak.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    res.json({ message: 'Berhasil menghapus data', data: deleted });
  } catch (error) {
    console.error('Gagal hapus:', error);
    res.status(500).json({ message: 'Gagal menghapus data', error });
  }
};

// Import Excel
exports.importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File tidak ditemukan" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data.length) {
      return res.status(400).json({ message: "Tidak ada data untuk diimport" });
    }

    const mappedData = data.map((row) => ({
      nama: row.nama || row.NAMA || "",
      npwp: row.npwp || row.NPWP || "",
      nomor_wa: row.nomor_wa || row.NO_WA || row["NO WA"] || "",
      status: (row.status || row.STATUS || "belum").toLowerCase() === "sudah" ? "sudah" : "belum",
    }));

    await WajibPajak.insertMany(mappedData);

    res.json({
      message: "Import berhasil",
      count: mappedData.length
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({
      message: "Gagal import data Excel",
      error: error.message
    });
  }
};