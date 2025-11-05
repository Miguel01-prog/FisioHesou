import mongoose from "mongoose";


const citaSchema = new mongoose.Schema({
    nombres: { type: String, required: true },
    apellidos: {type: String, required: true },
    fechaCita: {type: Date, required: true },
    fechaCitaStr: {type: String, required: true}, 
    horaCita: {type: String, required: true},
    area: {type: String, required: true},
    fechaCreado: { type: Date, default: Date.now }

});

export default mongoose.model('Cita', citaSchema);
 