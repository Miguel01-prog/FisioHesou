import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true }, // e.g. "clinica-alfa"
  logo: { type: String, default: "" },
  active: { type: Boolean, default: true },
  blockSundays: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  modules: { type: [String], default: ["agenda", "pacientes", "bloquear"] },
  // Branding & Sidebar Config
  sidebarName: { type: String, default: "" },
  sidebarSubtitle: { type: String, default: "" },
  theme: {
    primaryColor: { type: String, default: "#5e50a1" },
    accentColor: { type: String, default: "#10b981" },
    titleColor: { type: String, default: "#ffffff" },
    subtitleColor: { type: String, default: "#94a3b8" },
    sidebarBg: { type: String, default: "#0f172a" }
  },
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
