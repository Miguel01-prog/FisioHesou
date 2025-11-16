import Cita from "../models/cita.model.js";
import Paciente from "../models/pacientes.model.js";
import crypto from "crypto";


function generarIdentificadorPaciente(nombres, apellidos, telefono) {
  const base = `${nombres.trim().toLowerCase()}-${apellidos.trim().toLowerCase()}-${telefono}`;
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 10);
}


export const crearCita = async (req, res) => {
  console.log("- Crear cita: Creando una nueva cita...");
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


export const obtenerCitas = async (req, res) => {
  console.log("- Obtener Citas: Obteniendo todas las citas por area...");
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


export const obtenerCitaPorId = async (req, res) => {
  consuile.log("Obteniendo cita por ID...");
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


export const eliminarCita = async (req, res) => {
  console.log("Eliminando cita...");
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


export const obtenerCitasPorRol = async (req, res) => {
  console.log("Obteniendo citas por rol...");
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


export const validarPacientesNoRegistrados = async (req, res) => {
  console.log("Validando pacientes no registrados...");
  try {
    const citas = await Cita.find();

    if (!citas.length) {
      return res.status(404).json({ message: "No hay citas registradas" });
    }

    console.log("Se esta generando identificadores de pacientes...");
    const identificadoresCitas = citas.map(c =>
      generarIdentificadorPaciente(c.nombres, c.apellidos, c.telefono)
    );

    
    const pacientesExistentes = await Paciente.find({
      identificadorPaciente: { $in: identificadoresCitas }
    }).select("identificadorPaciente");

    const idsExistentes = new Set(pacientesExistentes.map(p => p.identificadorPaciente));

    const nuevosPacientes = [];

   
    for (const cita of citas) {
      const idPaciente = generarIdentificadorPaciente(cita.nombres, cita.apellidos, cita.telefono);

      if (!idsExistentes.has(idPaciente)) {
        console.log(`Registrando nuevo paciente: ${cita.nombres} ${cita.apellidos}`);
        const nuevoPaciente = new Paciente({
          nombres: cita.nombres,
          apellidos: cita.apellidos,
          edad: cita.edad,
          telefono: cita.telefono,
          identificadorPaciente: idPaciente,
          area: cita.area,
          esNuevo: true, 
          fechaRegistro: new Date()
        });

        await nuevoPaciente.save();
        nuevosPacientes.push(nuevoPaciente);
        idsExistentes.add(idPaciente);
      }
    }

    console.log("Se registro correctamente los pacientes nuevos.");

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


export const ObtenerDetallesPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Obteniendo detalles del paciente con ID:", id);
    const historial = await Cita.find({ identificadorPaciente: id })
      .sort({ fechaCitaStr: 1, horaCita: 1 });

    return res.status(200).json({
      total: historial.length,
      historial
    });

  } catch (err) {
    console.error("Error en obtenerHistorialPaciente:", err);
    res.status(500).json({ error: "Error al obtener historial del paciente" });
  }
};