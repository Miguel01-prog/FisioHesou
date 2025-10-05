import mongoose from "mongoose";


const citaSchema = new mongoose.Schema({
    nombreCompleto: String,
    numeroTelefono: String,
    fecha: Date,
    hora: String,
    creado: { type: Date, default: Date.now }

});

export default mongoose.model('Cita', citaSchema);
 