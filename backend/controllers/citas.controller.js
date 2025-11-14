import Cita from "../models/cita.model.js";
import Paciente from "../models/pacientes.model.js";
import crypto from "crypto";

// 🔹 Generar identificador único de paciente
function generarIdentificadorPaciente(nombres, apellidos, telefono) {
  const base = `${nombres.trim().toLowerCase()}-${apellidos.trim().toLowerCase()}-${telefono}`;
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 10);
}

// 🔹 Crear nueva cita
export const crearCita = async (req, res) => {
  try {
    const { nombres, apellidos, edad, telefono, fechaCitaStr, horaCita, area } = req.body;

    if (!nombres || !apellidos || !edad || !telefono || !fechaCitaStr || !horaCita || !area) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const fechaCita = new Date(fechaCitaStr);
    const identificadorPaciente = generarIdentificadorPaciente(nombres, apellidos, telefono);

    const nuevaCita = new Cita({
      nombres,
      apellidos,
      edad,
      telefono,
      fechaCita,
      fechaCitaStr,
      horaCita,
      area,
      identificadorPaciente
    });

    await nuevaCita.save();
    console.log("Cita creada correctamente");

    res.status(201).json({ message: "Cita creada correctamente", cita: nuevaCita });
  } catch (err) {
    console.error(" Error al crear cita:", err);
    res.status(500).json({ message: "Error al crear la cita", error: err.message });
  }
};

// 🔹 Obtener todas las citas (con filtro opcional por área)
export const obtenerCitas = async (req, res) => {
  try {
    const { area } = req.query;
    const filtro = area ? { area } : {};
    const citas = await Cita.find(filtro).sort({ fechaCita: 1 });
    res.json(citas);
  } catch (err) {
    console.error(" Error al obtener citas:", err);
    res.status(500).json({ message: "Error al obtener citas" });
  }
};

// 🔹 Obtener cita por ID
export const obtenerCitaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findById(id);
    if (!cita) return res.status(404).json({ message: "Cita no encontrada" });
    res.json(cita);
  } catch (err) {
    console.error(" Error al obtener cita:", err);
    res.status(500).json({ message: "Error al obtener cita" });
  }
};

// 🔹 Eliminar cita
export const eliminarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const citaEliminada = await Cita.findByIdAndDelete(id);
    if (!citaEliminada) return res.status(404).json({ message: "Cita no encontrada" });
    res.json({ message: "Cita eliminada correctamente" });
  } catch (err) {
    console.error(" Error al eliminar cita:", err);
    res.status(500).json({ message: "Error al eliminar cita" });
  }
};

// 🔹 Obtener citas por rol (área)
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
    console.error(" Error al obtener citas por rol:", err);
    res.status(500).json({ message: "Error al obtener citas por rol" });
  }
};

// 🔹 Validar y registrar pacientes no existentes
export const validarPacientesNoRegistrados = async (req, res) => {
  try {
    const citas = await Cita.find();

    if (!citas.length) {
      return res.status(404).json({ message: "No hay citas registradas" });
    }

    // Generar identificadores de todas las citas
    const identificadoresCitas = citas.map(c =>
      generarIdentificadorPaciente(c.nombres, c.apellidos, c.telefono)
    );

    // Buscar pacientes ya existentes
    const pacientesExistentes = await Paciente.find({
      identificadorPaciente: { $in: identificadoresCitas }
    }).select("identificadorPaciente");

    const idsExistentes = new Set(pacientesExistentes.map(p => p.identificadorPaciente));

    const nuevosPacientes = [];

    // Crear los pacientes que no existen aún
    for (const cita of citas) {
      const idPaciente = generarIdentificadorPaciente(cita.nombres, cita.apellidos, cita.telefono);

      if (!idsExistentes.has(idPaciente)) {
        const nuevoPaciente = new Paciente({
          nombres: cita.nombres,
          apellidos: cita.apellidos,
          edad: cita.edad,
          telefono: cita.telefono,
          identificadorPaciente: idPaciente,
          area: cita.area,
          esNuevo: true, // 🔹 marcar como nuevo
          fechaRegistro: new Date()
        });

        await nuevoPaciente.save();
        nuevosPacientes.push(nuevoPaciente);
        idsExistentes.add(idPaciente);
      }
    }

    console.log(`${nuevosPacientes.length} nuevos pacientes registrados`);

    res.json({
      totalCitas: citas.length,
      pacientesRegistrados: idsExistentes.size,
      pacientesNuevosCreados: nuevosPacientes.length,
      nuevosPacientes
    });
  } catch (err) {
    console.error("Error al validar o registrar pacientes:", err);
    res.status(500).json({ message: "Error al validar o registrar pacientes", error: err.message });
  }
};
