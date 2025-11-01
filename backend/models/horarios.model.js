import mongoose from "mongoose";

const horariosSchema = new mongoose.Schema({
  area: { type: String, enum: ["nutriologa", "fisioterapeuta"], required: true },
  fecha: { type: Date, required: true }, 
  fechaStr: { type: String, required: true }, // "YYYY-MM-DD"
  horasBloqueadas: [String] 
});

export default mongoose.model('Horarios', horariosSchema);
