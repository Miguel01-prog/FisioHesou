import mongoose from "mongoose";


const citaSchema = new mongoose.Schema({
    nombres: { type: String, required: true },
    apellidos: {type: String, required: true },
    edad: { type: Number, required: true },
    telefono: { type: String, required: true},
    fechaCita: {type: Date, required: true },
    fechaCitaStr: {type: String, required: true}, 
    horaCita: {type: String, required: true},
    area: {type: String, required: true},
    fechaCreado: { type: Date, default: Date.now },
    identificadorPaciente: { type: String, required: true, unique: true },


});

export default mongoose.model('Cita', citaSchema);
 