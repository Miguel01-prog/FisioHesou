import mongoose from "mongoose";

const notaSchema = new mongoose.Schema({
    identificadorPaciente: { type: String, required: true }, 
    idHistoricoFk: { type: String, required: true },
    fechaNota: { type: Date, default: Date.now },
    mesAñoNota: { type: String, required: true },
    contenidoNota: { type: String, default: "" },
    S: { type: String, default: "" },
    O: { type: String, default: "" },
    A: { type: String, default: "" },
    P: { type: String, default: "" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true }
}, { timestamps: true });

export default mongoose.model("Nota", notaSchema);
