import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define a minimal schema to query Historial
const HistorialSchema = new mongoose.Schema({
  identificadorPaciente: String,
  antecedentesFamiliares: [String],
  antecedentesMedicos: [String]
}, { strict: false });

const Historial = mongoose.model('Historial', HistorialSchema, 'historials');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas");
    const h = await Historial.findOne({});
    console.log("ONE HISTORY SAMPLE:");
    console.log(JSON.stringify(h, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
