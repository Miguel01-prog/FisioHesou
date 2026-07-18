import mongoose from "mongoose";

const planTratamientoSchema = new mongoose.Schema({
    identificadorPaciente: { type: String, required: true },
    fechaCreacion: { type: Date, default: Date.now },
    estado: { type: String, default: "Activo" },
    notasGenerales: { type: String, default: "" },
    ejercicios: [
        {
            ejercicio: { type: mongoose.Schema.Types.ObjectId, ref: "Ejercicio", required: true },
            series: { type: String, default: "" },
            repeticiones: { type: String, default: "" },
            frecuencia: { type: String, default: "" },
            notas: { type: String, default: "" }
        }
    ],
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true }
});

export default mongoose.model("PlanTratamiento", planTratamientoSchema);
