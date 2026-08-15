import Client from "../models/client.model.js";
import User from "../models/user.model.js";

// Crear nueva clínica (solo superadmin)
export const crearCliente = async (req, res) => {
  try {
    const { 
      name, 
      subdomain, 
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
    const existing = await Client.findOne({ subdomain: subdomain.toLowerCase(), _id: { $ne: id } });
    if (existing) {
      return res.status(409).json({ ok: false, message: "El subdominio ya está registrado por otra clínica" });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        name,
        subdomain: subdomain.toLowerCase(),
        patientLabelSingular,
        patientLabelPlural,
        specialistLabelSingular,
        specialistLabelPlural,
        services,
        modules,
        logo,
        active,
        blockSundays
      },
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

// Obtener estadísticas globales para Superadmin
export const obtenerStatsSuperadmin = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ active: true });
    const totalSpecialists = await User.countDocuments({ role: { $ne: "superadmin" } });

    const recentClients = await Client.find().sort({ createdAt: -1 }).limit(5);
    const recentSpecialists = await User.find({ role: { $ne: "superadmin" } })
      .populate("clientId")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    res.status(200).json({
      ok: true,
      stats: {
        totalClients,
        activeClients,
        totalSpecialists,
        recentClients,
        recentSpecialists
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
