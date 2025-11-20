const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Hardcode URI langsung
    await mongoose.connect('mongodb+srv://bpnd_db:HesoyamAezakmi3223!@bpnd.brdjonu.mongodb.net/?appName=bpnd', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB; 