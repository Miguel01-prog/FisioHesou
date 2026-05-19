import mongoose from "mongoose";

const ejercicioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, default: "" },
    imagenUrl: { type: String, default: "" },
    fechaCreacion: { type: Date, default: Date.now },
    activo: { type: Boolean, default: true }
});

export default mongoose.model("Ejercicio", ejercicioSchema);
