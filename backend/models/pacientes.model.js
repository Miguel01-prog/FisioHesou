import mongoose from "mongoose";

const pacienteSchema = new mongoose.Schema({
  identificadorPaciente: { type: String, required: true, unique: true },
  nombres: { type: String, required: true },
  apellidos: { type: String, required: true },
  edad: { type: Number, required: true },
  telefono: { type: String, required: true },
  area: { type: String, required: true },       
  fechaRegistro: { type: Date, default: Date.now },
  esNuevo: { type: Boolean, default: true }       
});

export default mongoose.model("Paciente", pacienteSchema);
