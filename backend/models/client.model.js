import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true }, // e.g. "clinica-alfa"
  logo: { type: String, default: "" },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  modules: { type: [String], default: ["agenda", "pacientes", "bloquear"] },
  // Custom Terminology
  patientLabelSingular: { type: String, default: "Paciente" },
  patientLabelPlural: { type: String, default: "Pacientes" },
  specialistLabelSingular: { type: String, default: "Especialista" },
  specialistLabelPlural: { type: String, default: "Especialistas" },
  // Custom Services
  services: {
    type: [
      {
        name: { type: String, required: true },
        key: { type: String, required: true },
        description: { type: String, default: "" },
        icon: { type: String, default: "📅" }
      }
    ],
    default: [
      { name: "Fisioterapia", key: "fisioterapia", description: "Rehabilitación y terapia física", icon: "🦽" },
      { name: "Nutrición", key: "nutriologa", description: "Planes y asesoría alimenticia", icon: "🍎" }
    ]
  }
});

export default mongoose.model("Client", clientSchema);
