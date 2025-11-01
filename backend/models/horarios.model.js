import mongoose from "mongoose";

const horarioSchema = new mongoose.Schema({
  area: { type: String, required: true },
  fecha: { type: Date, required: true },
  fechaStr: { type: String, required: true }, // "YYYY-MM-DD"
  blockedHours: { type: [String], default: [] }, // ["08:00", "09:00"]
});

export default mongoose.model("Horarios", horarioSchema);
