import mongoose from "mongoose";


const confgiuracionSchema = new mongoose.Schema({
    clave: { type: String, required: true },
    descripcion: { type: String, required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null }
});
export default mongoose.model("Configuracion", confgiuracionSchema);