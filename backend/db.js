import mongoose from "mongoose";
import dotenv from "dotenv";
import Module from "./models/module.model.js";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conexión exitosa a MongoDB Atlas");
    
    // Semilla automática para módulos de la barra lateral
    const count = await Module.countDocuments();
    if (count === 0) {
      console.log("Base de datos limpia detectada. Sembrando módulos del sistema por defecto...");
      const defaultModules = [
        { key: "agenda", label: "Citas", path: "agenda", icon: "FiCalendar", parentKey: null },
        { key: "pacientes", label: "Pacientes", path: "pacientes", icon: "FiUsers", parentKey: null },
        { key: "configuracion", label: "Configuración", path: "#", icon: "FiSettings", parentKey: null },
        { key: "bloquear", label: "Bloquear días", path: "bloquear", icon: "FiLock", parentKey: "configuracion" },
        { key: "ejercicios", label: "Ejercicios", path: "ejercicios", icon: "FiActivity", parentKey: "configuracion" },
        { key: "planes", label: "Planes Alimenticios", path: "planes", icon: "FiCoffee", parentKey: "configuracion" },
        { key: "antecedentes", label: "Antecedentes", path: "antecedentes", icon: "FiClipboard", parentKey: "configuracion" }
      ];
      await Module.insertMany(defaultModules);
      console.log("¡Módulos base sembrados exitosamente!");
    } else {
      const configExists = await Module.findOne({ key: "configuracion" });
      if (!configExists) {
        console.log("Migrando módulos existentes a la nueva estructura jerárquica...");
        await Module.deleteMany({});
        const defaultModules = [
          { key: "agenda", label: "Citas", path: "agenda", icon: "FiCalendar", parentKey: null },
          { key: "pacientes", label: "Pacientes", path: "pacientes", icon: "FiUsers", parentKey: null },
          { key: "configuracion", label: "Configuración", path: "#", icon: "FiSettings", parentKey: null },
          { key: "bloquear", label: "Bloquear días", path: "bloquear", icon: "FiLock", parentKey: "configuracion" },
          { key: "ejercicios", label: "Ejercicios", path: "ejercicios", icon: "FiActivity", parentKey: "configuracion" },
          { key: "planes", label: "Planes Alimenticios", path: "planes", icon: "FiCoffee", parentKey: "configuracion" },
          { key: "antecedentes", label: "Antecedentes", path: "antecedentes", icon: "FiClipboard", parentKey: "configuracion" }
        ];
        await Module.insertMany(defaultModules);
        console.log("¡Módulos migrados correctamente a estructura jerárquica!");
      }
    }
  } catch (e) {
    console.error("Error al conectar con MongoDB Atlas:", e);
  }
};
