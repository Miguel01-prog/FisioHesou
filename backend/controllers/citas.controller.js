import Cita from "../models/cita.model.js";

// Crear nueva cita
export const crearCita = async (req, res) => {
  try {
    const { nombres, apellidos, edad, fechaCitaStr, horaCita, area } = req.body;

    if (!nombres || !apellidos || !edad || !fechaCitaStr || !horaCita || !area) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const fechaCita = new Date(fechaCitaStr);

    const nuevaCita = new Cita({
      nombres,
      apellidos,
      edad,
      fechaCita,
      fechaCitaStr,
      horaCita,
      area
    });

    await nuevaCita.save();
    console.log("Cita creada correctamente");

    res.status(201).json({ message: "Cita creada correctamente", cita: nuevaCita });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear la cita" });
  }
};

// Obtener todas las citas (opcional filtrar por área)
export const obtenerCitas = async (req, res) => {
  try {
    const { area } = req.query;
    const filtro = area ? { area } : {};
    const citas = await Cita.find(filtro).sort({ fechaCita: 1 });
    res.json(citas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener citas" });
  }
};

// Obtener cita por ID
export const obtenerCitaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findById(id);
    if (!cita) return res.status(404).json({ message: "Cita no encontrada" });
    res.json(cita);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener cita" });
  }
};

// Eliminar cita
export const eliminarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const citaEliminada = await Cita.findByIdAndDelete(id);
    if (!citaEliminada) return res.status(404).json({ message: "Cita no encontrada" });
    res.json({ message: "Cita eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al eliminar cita" });
  }
};

// Obtener citas por rol (área)
export const obtenerCitasPorRol = async (req, res) => {
  try {
    const { rol } = req.params;

    if (!rol) {
      return res.status(400).json({ message: "Debe especificar un rol o área" });
    }

    const citas = await Cita.find({ area: rol }).sort({ fechaCita: 1 });

    if (!citas.length) {
      return res.status(404).json({ message: "No hay citas para este rol" });
    }

    res.json(citas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener citas por rol" });
  }
};
