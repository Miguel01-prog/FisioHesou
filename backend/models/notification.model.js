import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  area: { type: String, required: true }, // "fisioterapeuta" o "nutriologa"
  type: { type: String, default: "info" }, // "new_appointment", "upcoming_appointment", etc.
  citaId: { type: mongoose.Schema.Types.ObjectId, ref: "Cita" },
  identificadorPaciente: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Notification", notificationSchema);
