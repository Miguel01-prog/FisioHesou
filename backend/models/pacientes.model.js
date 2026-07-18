import mongoose from "mongoose";

const pacienteSchema = new mongoose.Schema({
  identificadorPaciente: { type: String, required: true },
  nombres: { type: String, required: true },
  apellidoPaterno: { type: String, required: true },
  apellidoMaterno: { type: String, default: "" },
  apellidos: { type: String }, // Físico para compatibilidad con código anterior y consultas directas
  edad: { type: Number, required: true },
  telefono: { type: String, required: true },
  email: { type: String, default: "" }, // Campo único amarrado para evitar duplicados
  area: { type: String, required: true },       
  fechaRegistro: { type: Date, default: Date.now },
  esNuevo: { type: Boolean, default: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true }
});

// Middleware pre-save para rellenar de forma transparente 'apellidos' y garantizar compatibilidad
pacienteSchema.pre("save", function(next) {
  this.apellidos = `${this.apellidoPaterno} ${this.apellidoMaterno || ""}`.trim();
  next();
});

export default mongoose.model("Paciente", pacienteSchema);
