import mongoose from "mongoose";

const horariosPacienteSchema = new mongoose.Schema({
    identificadorPaciente: { type: String, required: true },
    antecedentesFamiliares: { type: String, default: "Ninguna" },
    antecedentersMedicos: { type: String, default: "Ninguna" },
    antecedentesQuirurgicos: { type: String, default: "Ninguna" },
    consentimientoInformado: { type: String, default: "Si" },
    duracionPlan: { type: String, required: true},
    edad: { type: Number, required: true },
    fechaEvalcuacion: { type: Date, default: Date.now },
    fechaNacimiento: { String, required: true},
    frecuenciaSesiones: { type: String, required: true },
    habitosDeEjercicio: { type: String, default: "Ninguna" },
    intervencionesPrevias: { type: String, default: "Ninguna" },
    medicinaOcacional: { type: String, default: "Ninguna" },
    motivoConsulta: { type: String, required: true },
    objetivoDelPaciente: { type: String, required: true },
    objetivoCortoPlazo: { type: String, required: true },
    observaciones: { type: String, rquuired: true },
});

export default mongoose.model("HistorialPacientes", horariosPacienteSchema);