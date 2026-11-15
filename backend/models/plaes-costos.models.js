import mongoose from "mongoose";

const planCostoSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },
    nombre: {
      type: String,
      required: [true, "El nombre del plan o servicio es requerido"],
      trim: true
    },
    descripcion: {
      type: String,
      trim: true,
      default: ""
    },
    costo: {
      type: Number,
      required: [true, "El costo o precio es requerido"],
      min: [0, "El costo no puede ser negativo"]
    },
    sesiones: {
      type: Number,
      default: 1,
      min: [1, "Debe incluir al menos 1 sesión"]
    },
    tipo: {
      type: String,
      enum: ["sesion", "paquete", "suscripcion", "tratamiento", "consulta"],
      default: "sesion"
    },
    area: {
      type: String,
      enum: ["general", "fisioterapia", "fisioterapeuta", "nutriologa", "nutricion"],
      default: "general"
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("PlanCosto", planCostoSchema);
