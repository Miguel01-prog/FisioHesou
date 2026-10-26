import mongoose from "mongoose";

const expedienteArchivoSchema = new mongoose.Schema({
  identificadorPaciente: { type: String, required: true, index: true },
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Paciente" },
  historialId: { type: mongoose.Schema.Types.ObjectId, ref: "HistorialPacientes" },
  url: { type: String, required: true },
  nombreOriginal: { type: String, default: "" },
  mimetype: { type: String, default: "" },
  tamano: { type: Number, default: 0 },
  categoria: { 
    type: String, 
    default: "Radiografía",
    enum: ["Radiografía", "Receta Médica", "Estudio de Laboratorio", "Foto Clínica / Lesión", "Documento / Otro"]
  },
  descripcion: { type: String, default: "" },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: String, default: "" },
  activo: { type: Boolean, default: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true }
});

export default mongoose.model("ExpedienteArchivo", expedienteArchivoSchema);
