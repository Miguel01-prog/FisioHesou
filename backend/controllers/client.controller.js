import Client from "../models/client.model.js";
import User from "../models/user.model.js";
import Cita from "../models/cita.model.js";
import Paciente from "../models/pacientes.model.js";
import Nota from "../models/notas.model.js";
import Historial from "../models/historial-pacientes.model.js";
import PlanTratamiento from "../models/plan-tratamiento.model.js";


// Crear nueva clínica (solo superadmin)
export const crearCliente = async (req, res) => {
  try {
    const { 
      name, 
      subdomain, 
      tabTitle,
      sidebarName,
      sidebarSubtitle,
      theme,
      patientLabelSingular, 
      patientLabelPlural, 
      specialistLabelSingular, 
      specialistLabelPlural, 
      services, 
      modules,
      logo,
      blockSundays
    } = req.body;

    if (!name || !subdomain) {
      return res.status(400).json({ ok: false, message: "Nombre y subdominio son obligatorios" });
    }

    const existing = await Client.findOne({ subdomain: subdomain.toLowerCase() });
    if (existing) {
      return res.status(409).json({ ok: false, message: "El subdominio ya está registrado" });
    }

    const nuevoCliente = new Client({
      name,
      subdomain: subdomain.toLowerCase(),
      tabTitle: tabTitle || "FisioHesou - Sistema de Gestión Clínica",
      sidebarName: sidebarName || name,
      sidebarSubtitle: sidebarSubtitle || "",
      theme: theme || {
        primaryColor: "#5e50a1",
        accentColor: "#10b981",
        titleColor: "#ffffff",
        subtitleColor: "#94a3b8",
        sidebarBg: "#0f172a"
      },
      patientLabelSingular: patientLabelSingular || "Paciente",
      patientLabelPlural: patientLabelPlural || "Pacientes",
      specialistLabelSingular: specialistLabelSingular || "Especialista",
      specialistLabelPlural: specialistLabelPlural || "Especialistas",
      services: Array.isArray(services) && services.length > 0 ? services : undefined,
      modules: Array.isArray(modules) ? modules : ["agenda", "pacientes", "bloquear"],
      logo: logo || "",
      blockSundays: blockSundays !== undefined ? blockSundays : false
    });

    await nuevoCliente.save();
    res.status(201).json({ ok: true, client: nuevoCliente });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Obtener todas las clínicas (solo superadmin)
export const obtenerClientes = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.status(200).json({ ok: true, clients });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Obtener detalles públicos de una clínica por subdominio
export const obtenerClientePorSubdomain = async (req, res) => {
  const { subdomain } = req.params;

  try {
    const client = await Client.findOne({ subdomain: subdomain.toLowerCase(), active: true });
    if (!client) {
      return res.status(404).json({ ok: false, message: "Clínica no encontrada o inactiva" });
    }
    res.status(200).json({ ok: true, client });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Actualizar clínica (solo superadmin)
export const actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    subdomain, 
    tabTitle,
    sidebarName,
    sidebarSubtitle,
    theme,
    patientLabelSingular, 
    patientLabelPlural, 
    specialistLabelSingular, 
    specialistLabelPlural, 
    services, 
    modules, 
    logo,
    active,
    blockSundays
  } = req.body;

  try {
    if (subdomain) {
      const existing = await Client.findOne({ subdomain: subdomain.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ ok: false, message: "El subdominio ya está registrado por otra clínica" });
      }
    }

    const updateFields = {
      ...(name && { name }),
      ...(subdomain && { subdomain: subdomain.toLowerCase() }),
      ...(tabTitle !== undefined && { tabTitle }),
      ...(sidebarName !== undefined && { sidebarName }),
      ...(sidebarSubtitle !== undefined && { sidebarSubtitle }),
      ...(theme && { theme }),
      ...(patientLabelSingular && { patientLabelSingular }),
      ...(patientLabelPlural && { patientLabelPlural }),
      ...(specialistLabelSingular && { specialistLabelSingular }),
      ...(specialistLabelPlural && { specialistLabelPlural }),
      ...(services && { services }),
      ...(modules && { modules }),
      ...(logo !== undefined && { logo }),
      ...(active !== undefined && { active }),
      ...(blockSundays !== undefined && { blockSundays })
    };

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ ok: false, message: "Clínica no encontrada" });
    }

    res.status(200).json({ ok: true, client: updatedClient });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Actualizar personalización de marca y colores de la clínica del usuario autenticado (Superadmin / Admin)
export const actualizarBrandingCliente = async (req, res) => {
  try {
    const { sidebarName, sidebarSubtitle, theme, name, logo } = req.body;
    let clientId = req.user.clientId;

    // Si es superadmin y no tiene clientId asignado directamente, actualizar el primer cliente o req.body.clientId
    if (!clientId && req.user.role === "superadmin") {
      const firstClient = await Client.findOne();
      if (firstClient) clientId = firstClient._id;
    }

    if (!clientId) {
      return res.status(400).json({ ok: false, message: "No hay una clínica configurada para este usuario" });
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (sidebarName !== undefined) updateFields.sidebarName = sidebarName;
    if (sidebarSubtitle !== undefined) updateFields.sidebarSubtitle = sidebarSubtitle;
    if (logo !== undefined) updateFields.logo = logo;
    if (theme) updateFields.theme = theme;

    const clientActualizado = await Client.findByIdAndUpdate(
      clientId,
      updateFields,
      { new: true }
    );

    res.status(200).json({ ok: true, client: clientActualizado });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Obtener estadísticas globales para Superadmin y Dashboard General
export const obtenerStatsSuperadmin = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ active: true });
    const totalSpecialists = await User.countDocuments({ role: { $ne: "superadmin" } });
    const totalPatients = await Paciente.countDocuments();
    const totalAppointments = await Cita.countDocuments();
    const totalSoapNotes = await Nota.countDocuments();
    const totalHistories = await Historial.countDocuments();
    const totalPlans = await PlanTratamiento.countDocuments();

    // Citas de hoy
    const hoyStr = new Date().toISOString().split('T')[0];
    const todayAppointments = await Cita.countDocuments({
      $or: [{ fechaCitaStr: hoyStr }, { fechaCita: hoyStr }]
    });

    // Citas agrupadas por estado
    const citasPorEstadoRaw = await Cita.aggregate([
      { $group: { _id: "$estado", count: { $sum: 1 } } }
    ]);
    const appointmentsByStatus = {
      programado: 0,
      completado: 0,
      asistio: 0,
      cancelado: 0
    };
    citasPorEstadoRaw.forEach(item => {
      const key = (item._id || "programado").toLowerCase();
      if (appointmentsByStatus[key] !== undefined) {
        appointmentsByStatus[key] = item.count;
      } else {
        appointmentsByStatus.programado += item.count;
      }
    });

    // Citas agrupadas por área
    const citasPorAreaRaw = await Cita.aggregate([
      { $group: { _id: "$area", count: { $sum: 1 } } }
    ]);
    const appointmentsByArea = {
      fisioterapia: 0,
      nutricion: 0
    };
    citasPorAreaRaw.forEach(item => {
      const key = (item._id || "").toLowerCase();
      if (key.includes("fisio")) {
        appointmentsByArea.fisioterapia += item.count;
      } else if (key.includes("nutri")) {
        appointmentsByArea.nutricion += item.count;
      }
    });

    // Registros recientes
    const recentClients = await Client.find().sort({ createdAt: -1 }).limit(5);
    const recentSpecialists = await User.find({ role: { $ne: "superadmin" } })
      .populate("clientId")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    const recentPatients = await Paciente.find()
      .sort({ createdAt: -1, fechaRegistro: -1 })
      .limit(5)
      .select("nombres apellidos identificadorPaciente area fechaRegistro clientId");

    const recentAppointments = await Cita.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("nombres apellidoPaterno apellidoMaterno fechaCitaStr horaCita area estado motivo identificadorPaciente");

    res.status(200).json({
      ok: true,
      stats: {
        totalClients,
        activeClients,
        totalSpecialists,
        totalPatients,
        totalAppointments,
        todayAppointments,
        totalSoapNotes,
        totalHistories,
        totalPlans,
        appointmentsByStatus,
        appointmentsByArea,
        recentClients,
        recentSpecialists,
        recentPatients,
        recentAppointments
      }
    });
  } catch (err) {
    console.error("Error en obtenerStatsSuperadmin:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

