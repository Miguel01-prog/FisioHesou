import mongoose from "mongoose";

const ejercicioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, default: "" },
    imagenUrl: { type: String, default: "" },
    fechaCreacion: { type: Date, default: Date.now },
    activo: { type: Boolean, default: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null }
});

export default mongoose.model("Ejercicio", ejercicioSchema);
