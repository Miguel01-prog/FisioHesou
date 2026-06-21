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
    const { nombres, apellidoPaterno, apellidoMaterno, edad, telefono, email, fechaCitaStr, horaCita, area } = req.body;

    if (!nombres || !apellidoPaterno || !edad || !telefono || !fechaCitaStr || !horaCita || !area) {
      return res.status(400).json({ message: "Todos los campos obligatorios deben ser completados" });
    }

    // 1. Verificar si el paciente ya existe de forma robusta por nombres, apellidos separados y teléfono, O amarrado por email
    let pacienteExiste = null;
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    if (cleanEmail !== "") {
      pacienteExiste = await Paciente.findOne({
        $or: [
          {
            nombres: { $regex: new RegExp(`^${nombres.trim()}$`, "i") },
            apellidoPaterno: { $regex: new RegExp(`^${apellidoPaterno.trim()}$`, "i") },
            apellidoMaterno: { $regex: new RegExp(`^${(apellidoMaterno || "").trim()}$`, "i") },
            telefono: telefono.trim()
          },
          {
            email: cleanEmail
          }
        ]
      });
    } else {
      pacienteExiste = await Paciente.findOne({
        nombres: { $regex: new RegExp(`^${nombres.trim()}$`, "i") },
        apellidoPaterno: { $regex: new RegExp(`^${apellidoPaterno.trim()}$`, "i") },
        apellidoMaterno: { $regex: new RegExp(`^${(apellidoMaterno || "").trim()}$`, "i") },
        telefono: telefono.trim()
      });
    }

    let identificadorPaciente;
    const esNuevoPaciente = !pacienteExiste;

    if (pacienteExiste) {
      // Reutilizar el identificador del expediente existente
      identificadorPaciente = pacienteExiste.identificadorPaciente;
      console.log(`Paciente existente detectado. ID Reutilizado: ${identificadorPaciente}`);
    } else {
      // Generar identificador único aleatorio para expediente nuevo
      identificadorPaciente = crypto.randomBytes(6).toString("hex");
      console.log(`Paciente nuevo detectado. ID Único Generado: ${identificadorPaciente}`);
    }

    // 2. Si no existe → crear paciente de forma transparente (el pre-save hook compilará 'apellidos')
    if (!pacienteExiste) {
      await Paciente.create({
        nombres,
        apellidoPaterno,
        apellidoMaterno: apellidoMaterno || "",
        edad,
        telefono,
        email: cleanEmail,
        identificadorPaciente,
        area,
        esNuevo: true,
        fechaRegistro: new Date(),
      });
      console.log("Paciente nuevo creado automáticamente con apellidos separados y email único.");
    }

    // 3. Registrar la cita
    const fechaCita = new Date(fechaCitaStr);

    const nuevaCita = new Cita({
      nombres,
      apellidoPaterno,
      apellidoMaterno: apellidoMaterno || "",
      edad,
      telefono,
      email: cleanEmail,
      fechaCita,
      fechaCitaStr,
      horaCita,
      area,
      identificadorPaciente,
      esNuevoPaciente
    });

    await nuevaCita.save();

    res.status(201).json({ 
      message: esNuevoPaciente ? "Cita y expediente creados correctamente" : "Cita creada correctamente", 
      cita: nuevaCita,
      pacienteNuevo: esNuevoPaciente 
    });
  } catch (err) {
    console.error(" Error al crear cita:", err);
    res.status(500).json({ message: "Error al crear la cita", error: err.message });
  }
};

export const crearCitaManual = async (req, res) => {
  console.log("- Crear cita manual (paciente existente)...");
  try {
    const { identificadorPaciente, fechaCitaStr, horaCita, area } = req.body;

    if (!identificadorPaciente || !fechaCitaStr || !horaCita || !area) {
      return res.status(400).json({ message: "Todos los campos obligatorios deben ser completados" });
    }

    // Buscar al paciente existente por su identificadorPaciente
    const paciente = await Paciente.findOne({ identificadorPaciente });
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    const fechaCita = new Date(fechaCitaStr);

    const parts = (paciente.apellidos || "").trim().split(/\s+/);
    const paternal = paciente.apellidoPaterno || parts[0] || "No especificado";
    const maternal = paciente.apellidoMaterno || parts.slice(1).join(" ") || "";

    const nuevaCita = new Cita({
      nombres: paciente.nombres,
      apellidoPaterno: paternal,
      apellidoMaterno: maternal,
      apellidos: paciente.apellidos || `${paternal} ${maternal}`.trim(),
      edad: paciente.edad,
      telefono: paciente.telefono,
      email: paciente.email || "",
      fechaCita,
      fechaCitaStr,
      horaCita,
      area,
      identificadorPaciente,
      esNuevoPaciente: false
    });

    await nuevaCita.save();

    res.status(201).json({ 
      message: "Cita creada correctamente para el paciente existente", 
      cita: nuevaCita
    });
  } catch (err) {
    console.error(" Error al crear cita manual:", err);
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

export const actualizarEstadoCita = async (req, res) => {
  console.log("Actualizando estado de cita...");
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({ message: "El campo 'estado' es requerido" });
    }

    const citaActualizada = await Cita.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );

    if (!citaActualizada) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    res.json({ message: "Estado de cita actualizado correctamente", cita: citaActualizada });
  } catch (err) {
    console.error("Error al actualizar estado de cita:", err);
    res.status(500).json({ message: "Error al actualizar estado de la cita", error: err.message });
  }
};

export const actualizarCita = async (req, res) => {
  console.log("- Actualizando/Reagendando cita...");
  try {
    const { id } = req.params;
    const { fechaCitaStr, horaCita, area } = req.body;

    if (!fechaCitaStr || !horaCita) {
      return res.status(400).json({ message: "La fecha y la hora son requeridas" });
    }

    const fechaCita = new Date(fechaCitaStr);

    const updateFields = {
      fechaCita,
      fechaCitaStr,
      horaCita,
      estado: "Programado"
    };
    if (area) {
      updateFields.area = area;
    }

    const citaActualizada = await Cita.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!citaActualizada) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    res.json({ message: "Cita reprogramada correctamente", cita: citaActualizada });
  } catch (err) {
    console.error("Error al actualizar cita:", err);
    res.status(500).json({ message: "Error al actualizar la cita", error: err.message });
  }
};