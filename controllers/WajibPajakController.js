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

    if (!ids || ids.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang dipilih.' });
    }

    const data = await WajibPajak.find({ _id: { $in: ids } });
    const numbers = data.map(d => d.nomor_wa);

    const failed = [];

    for (const no of numbers) {
      const raw = formatNumber(no);
      const number = raw.includes('@c.us') ? raw : `${raw}@c.us`;

      try {
        await client.sendMessage(number, message || 'Halo, Anda belum melaporkan pajak. Harap segera melapor.');
      } catch (err) {
        console.error(`Gagal kirim ke ${number}:`, err.message);
        failed.push(no);
      }
    }

    if (failed.length > 0) {
      return res.status(207).json({
        message: `Beberapa pesan gagal dikirim ke: ${failed.join(', ')}`,
        failed,
      });
    }

    return res.json({ message: 'Pesan berhasil dikirim ke semua nomor yang dipilih.' });
  } catch (err) {
    console.error('Error kirim WA blast:', err.message);
    return res.status(500).json({ message: err.message });
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