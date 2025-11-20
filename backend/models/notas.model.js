import mongoose from "mongoose";

const notaSchema = new mongoose.Schema({
    identificadorPaciente: { type: String, required: false },
    idHistorialFK: { type: String, required: false },
    idNota: { type: String, required: true },
    fechaNota: { type: Date, default: Date.now },
    mesAñoNota: { type: String, required: true },
    contenidoNota: { type: String, required: true },
    S : { type: String, required: true },
    O : { type: String, required: true },
    A : { type: String, required: true },
    P : { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Nota", notaSchema);
