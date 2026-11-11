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
  especialistaId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  especialistaNombre: { type: String, default: "" },
  fechaCreado: { type: Date, default: Date.now },
  identificadorPaciente: { type: String, required: true },
  esNuevoPaciente: { type: Boolean, default: false },
  estado: { type: String, default: "Programado" },
  fechaCancelacion: { type: Date, default: null },
  motivoCancelacion: { type: String, default: "" },
  canceladoPor: { type: String, default: "" },
  fechaAnteriorStr: { type: String, default: "" },
  horaAnterior: { type: String, default: "" },
  // Adeudo por cancelación tardía (< 24 hrs): se cobra en la siguiente cita del paciente
  tieneAdeudo: { type: Boolean, default: false },
  adeudoPagado: { type: Boolean, default: false },
  adeudoFechaCitaStr: { type: String, default: "" }, // Fecha de la cita cancelada que generó el adeudo
  adeudoHoraCita: { type: String, default: "" },
  adeudoHorasAnticipacion: { type: Number, default: null }, // Horas de anticipación con las que se canceló
  fechaPagoAdeudo: { type: Date, default: null },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true }
});

// Middleware pre-save para asegurar consistencia del campo 'apellidos'
citaSchema.pre("save", function(next) {
  this.apellidos = `${this.apellidoPaterno} ${this.apellidoMaterno || ""}`.trim();
  next();
});

export default mongoose.model("Cita", citaSchema);