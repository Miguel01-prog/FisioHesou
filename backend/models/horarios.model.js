import mongoose from "mongoose";

const bloqueHorarioSchema = new mongoose.Schema({
  inicio: { type: String, required: true }, // "10:00"
  fin: { type: String, required: true }     // "11:00"
});

const disponibilidadDiaSchema = new mongoose.Schema({
  dia: { 
    type: String, 
    enum: ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'], 
    required: true 
  },
  horarios: [String],           // Horarios disponibles normalmente
  bloques: [bloqueHorarioSchema] // Intervalos que no atenderá
});

const horariosSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipoConsulta: { type: String, enum: ['fisioterapia','nutriologa'], required: true },
  disponibilidad: [disponibilidadDiaSchema]
});

export default mongoose.model('Horarios', horariosSchema);
