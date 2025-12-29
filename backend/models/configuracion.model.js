import mongoose from "mongoose";


const confgiuracionSchema = new mongoose.Schema({
    clave: { type: String, required: true },
    descripcion: { type: String, required: true },
});
export default mongoose.model("Configuracion", confgiuracionSchema);