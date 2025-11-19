const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function saveBase64Image(base64Data, userId) {
  try {
    // Pastikan folder untuk simpan foto user ada
    const dirPath = path.join(__dirname, '..', 'uploads', 'faces', String(userId));
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Hapus prefix base64
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');

    // Nama file unik
    const fileName = `${uuidv4()}.jpg`;
    const filePath = path.join(dirPath, fileName);

    // Simpan file
    fs.writeFileSync(filePath, buffer);

    return fileName;
  } catch (err) {
    throw new Error('Gagal menyimpan gambar');
  }
}

module.exports = saveBase64Image;
