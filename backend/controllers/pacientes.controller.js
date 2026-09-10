import Paciente from "../models/pacientes.model.js";
import Cita from "../models/cita.model.js";
import HistorialPacientes from "../models/historial-pacientes.model.js";
import Nota from "../models/notas.model.js";
import PlanTratamiento from "../models/plan-tratamiento.model.js";
import crypto from "crypto";
import mongoose from "mongoose";

export const obtenerTodosPacientes = async (req, res) => {
  console.log("- Obteniendo todos los pacientes...");
  try {
    const filter = req.user.role === 'superadmin' ? {} : { clientId: req.user.clientId };
    const pacientes = await Paciente.find(filter).sort({ nombres: 1 });

    if (!pacientes.length) {
      return res.status(404).json({ message: "No hay pacientes registrados" });
    }

    res.json(pacientes);
  } catch (err) {
    console.error("Error al obtener pacientes:", err);
    res.status(500).json({ message: "Error al obtener pacientes" });
  }
};

export const obtenerPacientesSinNota = async (req, res) => {
  try {
    const roleFilter = req.user.role === 'superadmin' ? {} : {
      $or: [
        { clientId: req.user.clientId },
        { clientId: { $exists: false } },
        { clientId: null }
      ]
    };

    const filter = { ...roleFilter };
    
    if (req.user.role === 'fisioterapeuta') {
      filter.area = { $in: ['fisioterapia', 'fisioterapeuta'] };
    } else if (req.user.role === 'nutriologa') {
      filter.area = { $in: ['nutriologa', 'nutricion', 'nutriología'] };
    }

    // 1. Obtener pacientes asignados al área
    const pacientes = await Paciente.find(filter).sort({ fechaRegistro: -1 });

    // 2. Obtener identificadores de pacientes que SÍ TIENEN Historial Clínico registrado
    const historiales = await HistorialPacientes.find(roleFilter, { identificadorPaciente: 1 });
    const historialesSet = new Set(
      historiales
        .map(h => h.identificadorPaciente)
        .filter(id => id && String(id).trim() !== "")
        .map(id => String(id).trim())
    );

    // 3. Obtener identificadores de pacientes que SÍ TIENEN Nota SOAP válida con contenido
    const notas = await Nota.find(roleFilter);
    const notasSet = new Set();
    notas.forEach(n => {
      if (!n.identificadorPaciente) return;
      const hasContenido = Boolean(
        n.contenidoNota && 
        n.contenidoNota.trim() !== "" && 
        n.contenidoNota !== "Nota de evolución y seguimiento clínico" &&
        n.contenidoNota !== "Nota de seguimiento clínico sin observaciones"
      );
      const hasSOAP = Boolean(
        (n.S && n.S.trim() !== "") ||
        (n.O && n.O.trim() !== "") ||
        (n.A && n.A.trim() !== "") ||
        (n.P && n.P.trim() !== "")
      );
      if (hasContenido || hasSOAP) {
        notasSet.add(String(n.identificadorPaciente).trim());
      }
    });

    // 4. Filtrar: Mostrar UNICAMENTE pacientes que tienen Historial Clínico Y NO tienen Nota SOAP
    const pacientesSinNota = pacientes.filter(p => {
      if (!p.identificadorPaciente) return false;
      const idStr = String(p.identificadorPaciente).trim();
      const tieneHistorial = historialesSet.has(idStr);
      const tieneNota = notasSet.has(idStr);
      return tieneHistorial && !tieneNota;
    });

    res.json({ ok: true, count: pacientesSinNota.length, pacientes: pacientesSinNota });
  } catch (err) {
    console.error("Error al obtener pacientes sin nota:", err);
    res.status(500).json({ ok: false, message: "Error al obtener pacientes sin nota", error: err.message });
  }
};

export const crearPaciente = async (req, res) => {
  console.log("- Creando nuevo paciente manualmente...");
  try {
    const { nombres, apellidoPaterno, apellidoMaterno, edad, telefono, email, area } = req.body;

    if (!nombres || !apellidoPaterno || !edad || !telefono || !area) {
      return res.status(400).json({ message: "Los campos Nombres, Apellido Paterno, Edad, Teléfono y Área son requeridos" });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : "";

    // Verificar si ya existe en la misma clínica
    let pacienteExiste = null;
    if (cleanEmail !== "") {
      pacienteExiste = await Paciente.findOne({
        clientId: req.user.clientId,
        $or: [
          {
            nombres: { $regex: new RegExp(`^${nombres.trim()}$`, "i") },
            apellidoPaterno: { $regex: new RegExp(`^${apellidoPaterno.trim()}$`, "i") },
            apellidoMaterno: { $regex: new RegExp(`^${(apellidoMaterno || "").trim()}$`, "i") },
            telefono: telefono.trim()
          },
          { email: cleanEmail }
        ]
      });
    } else {
      pacienteExiste = await Paciente.findOne({
        clientId: req.user.clientId,
        nombres: { $regex: new RegExp(`^${nombres.trim()}$`, "i") },
        apellidoPaterno: { $regex: new RegExp(`^${apellidoPaterno.trim()}$`, "i") },
        apellidoMaterno: { $regex: new RegExp(`^${(apellidoMaterno || "").trim()}$`, "i") },
        telefono: telefono.trim()
      });
    }

    if (pacienteExiste) {
      return res.status(409).json({ message: "El paciente ya se encuentra registrado con esos datos o correo electrónico" });
    }

    const identificadorPaciente = crypto.randomBytes(6).toString("hex");

    const nuevoPaciente = await Paciente.create({
      nombres,
      apellidoPaterno,
      apellidoMaterno: apellidoMaterno || "",
      edad,
      telefono,
      email: cleanEmail,
      area,
      identificadorPaciente,
      esNuevo: true,
      fechaRegistro: new Date(),
      clientId: req.user.clientId
    });

    res.status(201).json({ message: "Paciente registrado correctamente", paciente: nuevoPaciente });
  } catch (err) {
    console.error("Error al crear paciente:", err);
    res.status(500).json({ message: "Error al registrar el paciente", error: err.message });
  }
};

export const eliminarPaciente = async (req, res) => {
  console.log("- Eliminando paciente...");
  try {
    const { id } = req.params;

    // 1. Buscar al paciente
    const paciente = await Paciente.findOne({ identificadorPaciente: id, clientId: req.user.clientId });
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    // 2. Eliminar paciente
    await Paciente.deleteOne({ identificadorPaciente: id, clientId: req.user.clientId });

    // 3. Eliminar registros relacionados (Cascade Delete)
    await Cita.deleteMany({ identificadorPaciente: id, clientId: req.user.clientId });
    await HistorialPacientes.deleteMany({ identificadorPaciente: id, clientId: req.user.clientId });
    await Nota.deleteMany({ identificadorPaciente: id, clientId: req.user.clientId });
    await PlanTratamiento.deleteMany({ identificadorPaciente: id, clientId: req.user.clientId });

    res.json({ message: "Paciente y todos sus registros relacionados fueron eliminados correctamente" });
  } catch (err) {
    console.error("Error al eliminar paciente:", err);
    res.status(500).json({ message: "Error al eliminar paciente", error: err.message });
  }
};

export const obtenerPacientePorId = async (req, res) => {
  console.log("- Obteniendo paciente por ID:", req.params.id);
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const matchConditions = [
      { identificadorPaciente: id },
      ...(isObjectId ? [{ _id: id }] : [])
    ];

    let filter = {};
    if (req.user.role === 'superadmin') {
      filter = { $or: matchConditions };
    } else {
      filter = {
        clientId: req.user.clientId,
        $or: matchConditions
      };
    }

    const paciente = await Paciente.findOne(filter);
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }
    res.json(paciente);
  } catch (err) {
    console.error("Error al obtener paciente por ID:", err);
    res.status(500).json({ message: "Error al obtener paciente" });
  }
};