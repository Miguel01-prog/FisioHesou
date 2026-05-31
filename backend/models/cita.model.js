import mongoose from "mongoose";

const citaSchema = new mongoose.Schema({
  nombres: { type: String, required: true },
  apellidoPaterno: { type: String, required: true },
  apellidoMaterno: { type: String, default: "" },
  apellidos: { type: String }, // Físico para asegurar compatibilidad total con listados heredados
  edad: { type: Number, required: true },
  telefono: { type: String, required: true },
  email: { type: String, default: "" }, // Correo del paciente para amarre único
  fechaCita: { type: Date, required: true },
  fechaCitaStr: { type: String, required: true }, 
  horaCita: { type: String, required: true },
  area: { type: String, required: true },
  fechaCreado: { type: Date, default: Date.now },
  identificadorPaciente: { type: String, required: true },
  esNuevoPaciente: { type: Boolean, default: false }
});

// Middleware pre-save para asegurar consistencia del campo 'apellidos'
citaSchema.pre("save", function(next) {
  this.apellidos = `${this.apellidoPaterno} ${this.apellidoMaterno || ""}`.trim();
  next();
});

export default mongoose.model("Cita", citaSchema);