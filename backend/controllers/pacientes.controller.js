import Paciente from "../models/pacientes.model.js";

export const obtenerTodosPacientes = async (req, res) => {
  console.log("- Obteniendo todos los pacientes...");
  try {
    const pacientes = await Paciente.find().sort({ nombres: 1 });

    if (!pacientes.length) {
      return res.status(404).json({ message: "No hay pacientes registrados" });
    }

    res.json(pacientes);
  } catch (err) {
    console.error("Error al obtener pacientes:", err);
    res.status(500).json({ message: "Error al obtener pacientes" });
  }
};