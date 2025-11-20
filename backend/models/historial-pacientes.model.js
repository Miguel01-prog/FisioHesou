import mongoose from "mongoose";

const horariosPacienteSchema = new mongoose.Schema({
    identificadorPaciente: { type: String, required: true },
    idHistorial: { type: String, required: true },
    motivoConsulta: { type: String, required: true },
    antecedentesFamiliares: { type: String, default: "Ninguna" },
    antecedentesMedicos: { type: String, default: "Ninguna" },
    antecedentesQuirurgicos: { type: String, default: "Ninguna" },
    habitosDeEjercicio: { type: String, default: "Ninguna" },
    consentimientoInformado: { type: String, default: "Si" },
    duracionPlan: { type: String, required: true},
    fechaEvaluacion: { type: Date, default: Date.now },
    frecuenciaSesiones: { type: String, required: true },
    intervencionesPrevias: { type: String, default: "Ninguna" },
    medicacionActual: { type: String, default: "Ninguna" },
    objetivoCortoPlazo: { type: String, required: true },
    obserExpoloraciones: { type: String, required: true },
    PruevbasEspeciales: { type: String, required: true },
    ResultadoPruebas: { type: String, required: true },
    observaciones: { type: String, rquuired: true },
});

export default mongoose.model("HistorialPacientes", horariosPacienteSchema);