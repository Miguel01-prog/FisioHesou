import mongoose from "mongoose";

const historialPacienteSchema = new mongoose.Schema({

    identificadorPaciente: { type: String, required: true },
    idHistorial: { type: String, required: true },
    antecedentesFamiliares: { type: [String], default: [] },
    antecedentesMedicos: { type: [String], default: [] },
    antecedentesQuirurgicos: { type: [String], default: [] },
    motivoConsulta: { type: String, required: true },
    fechaEvaluacion: { type: Date, default: Date.now },
    duracionPlan: { type: String, required: true },
    frecuenciaSesiones: { type: String, required: true },
    habitosDeEjercicio: { type: [String], default: [] },
    consentimientoInformado: { type: String, default: "Sí" },
    intervencionesPrevias: { type: String, default: "No" },
    cualesIntervenciones: { type: [String], default: [] },
    medicacionActual: { type: String, default: "Ninguna" },
    objetivoCortoPlazo: { type: String, required: true },
    obserExploraciones: { type: String, required: true },
    pruebasEspeciales: { type: String, default: "No" }, 
    cualesPruebasEspeciales: { type: [String], default: [] },
    resultadoPruebas: { type: String, default: "" },
    observacionesHistorial: { type: String, required: true },
    soapFK: { type: mongoose.Schema.Types.ObjectId, ref: "Nota" },
});

export default mongoose.model("HistorialPacientes", historialPacienteSchema);
