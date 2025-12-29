import mongoose from "mongoose";

const confItemSchema = new mongoose.Schema({
    configuracion: {type: mongoose.Schema.Types.ObjectId, ref: "Configuracion", required: true},
    valor: {type: String, required: true, trim: true}
  }, {timestamps: true}
);


export default mongoose.model("ConfItem", confItemSchema);