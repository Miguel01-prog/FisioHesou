import mongoose from "mongoose";

const confItemSchema = new mongoose.Schema({
    configuracion: {type: mongoose.Schema.Types.ObjectId, ref: "Configuracion", required: true},
    valor: {type: String, required: true, trim: true},
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null }
  }, {timestamps: true}
);


export default mongoose.model("ConfItem", confItemSchema);