import Cita from "../models/cita.model.js";
import Paciente from "../models/pacientes.model.js";
import crypto from "crypto";
import Notification from "../models/notification.model.js";


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

    // Crear notificación para el especialista
    try {
      await Notification.create({
        title: "Nueva Cita Agendada (Pública)",
        description: `El paciente ${nombres} ${apellidoPaterno} agendó una cita de ${area} para el ${fechaCitaStr} a las ${horaCita}.`,
        area: area === "fisioterapia" || area === "fisioterapeuta" ? "fisioterapeuta" : "nutriologa",
        type: "new_appointment",
        citaId: nuevaCita._id,
        identificadorPaciente: nuevaCita.identificadorPaciente
      });
    } catch (e) {
      console.error("Error al crear notificación de cita pública:", e);
    }

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

    // Crear notificación para el especialista
    try {
      await Notification.create({
        title: "Nueva Cita Registrada (Manual)",
        description: `Cita manual para ${paciente.nombres} ${paternal} agendada para el ${fechaCitaStr} a las ${horaCita}.`,
        area: area === "fisioterapia" || area === "fisioterapeuta" ? "fisioterapeuta" : "nutriologa",
        type: "new_appointment",
        citaId: nuevaCita._id,
        identificadorPaciente: nuevaCita.identificadorPaciente
      });
    } catch (e) {
      console.error("Error al crear notificación de cita manual:", e);
    }

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
    let filtro = {};
    if (area) {
      const areasABuscar = [area];
      if (area === "fisioterapia" || area === "fisioterapeuta") {
        areasABuscar.push("fisioterapia", "fisioterapeuta");
      } else if (area === "nutriologa" || area === "nutricion" || area === "nutriología") {
        areasABuscar.push("nutriologa", "nutricion", "nutriología");
      }
      filtro = { area: { $in: areasABuscar } };
    }
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

    const areasABuscar = [rol];
    if (rol === "fisioterapia" || rol === "fisioterapeuta") {
      areasABuscar.push("fisioterapia", "fisioterapeuta");
    } else if (rol === "nutriologa" || rol === "nutricion" || rol === "nutriología") {
      areasABuscar.push("nutriologa", "nutricion", "nutriología");
    }

    const citas = await Cita.find({ area: { $in: areasABuscar } }).sort({ fechaCita: 1 });
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

export const crearCitaManualCompleta = async (req, res) => {
  console.log("- Crear cita manual completa...");
  try {
    let { identificadorPaciente, nombres, apellidoPaterno, apellidoMaterno, edad, telefono, email, fechaCitaStr, horaCita, area } = req.body;

    if (!fechaCitaStr || !horaCita || !area) {
      return res.status(400).json({ message: "La fecha, hora y área de la cita son obligatorios" });
    }

    let esNuevoPaciente = true;
    let pacienteExiste = null;

    // Si se pasa un ID directo, buscar primero por ID
    if (identificadorPaciente) {
      pacienteExiste = await Paciente.findOne({ identificadorPaciente });
      if (pacienteExiste) {
        esNuevoPaciente = false;
        console.log(`Paciente existente encontrado por ID: ${identificadorPaciente}`);
      }
    }

    // Si no se encontró por ID, pero tenemos datos relevantes, buscar por nombres/teléfono
    const tieneNombres = nombres && nombres.trim() !== "";
    const tieneApellido = apellidoPaterno && apellidoPaterno.trim() !== "";
    const tieneTelefono = telefono && telefono.trim() !== "";
    const tieneDatosRelevantes = tieneNombres && tieneApellido && tieneTelefono;

    if (esNuevoPaciente && tieneDatosRelevantes) {
      // 1. Verificar si el paciente ya existe en la base de datos
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

      if (pacienteExiste) {
        identificadorPaciente = pacienteExiste.identificadorPaciente;
        esNuevoPaciente = false;
        console.log(`Paciente existente encontrado por coincidencia de datos: ID ${identificadorPaciente}`);
      } else {
        // Generar identificador normal (12-char hex)
        identificadorPaciente = crypto.randomBytes(6).toString("hex");
        console.log(`Paciente nuevo con datos completos. ID: ${identificadorPaciente}`);
      }
    } else if (esNuevoPaciente) {
      // Si faltan datos relevantes y no existe por ID:
      // Asignar placeholders para cumplir las validaciones del esquema
      nombres = nombres && nombres.trim() !== "" ? nombres.trim() : "Paciente Manual Incompleto";
      apellidoPaterno = apellidoPaterno && apellidoPaterno.trim() !== "" ? apellidoPaterno.trim() : "Sin Apellido";
      apellidoMaterno = apellidoMaterno || "";
      edad = edad ? Number(edad) : 0;
      
      // Asignar un número de teléfono diferente para distinguir que faltan datos
      telefono = telefono && telefono.trim() !== "" ? telefono.trim() : `000-${Math.floor(100000 + Math.random() * 900000)}`;
      email = email ? email.trim().toLowerCase() : "";

      // Asignar un identificador de paciente diferente (prefijo INC-)
      identificadorPaciente = `INC-${Math.floor(100000 + Math.random() * 900000)}`;
      console.log(`Paciente incompleto. Generando ID de control: ${identificadorPaciente} y Teléfono: ${telefono}`);
    }

    // 2. Si es un nuevo expediente (ya sea completo o incompleto), crearlo
    if (esNuevoPaciente) {
      pacienteExiste = await Paciente.create({
        nombres,
        apellidoPaterno,
        apellidoMaterno: apellidoMaterno || "",
        edad: edad || 0,
        telefono,
        email: email || "",
        identificadorPaciente,
        area,
        esNuevo: true,
        fechaRegistro: new Date(),
      });
      console.log("Paciente creado automáticamente desde cita manual.");
    } else {
      // Si el paciente ya existe, nos aseguramos de usar sus datos guardados para la cita
      nombres = pacienteExiste.nombres;
      apellidoPaterno = pacienteExiste.apellidoPaterno;
      apellidoMaterno = pacienteExiste.apellidoMaterno;
      edad = pacienteExiste.edad;
      telefono = pacienteExiste.telefono;
      email = pacienteExiste.email;
    }

    // 3. Crear la cita
    const fechaCita = new Date(fechaCitaStr);
    const nuevaCita = new Cita({
      nombres,
      apellidoPaterno,
      apellidoMaterno: apellidoMaterno || "",
      edad: edad || 0,
      telefono,
      email: email || "",
      fechaCita,
      fechaCitaStr,
      horaCita,
      area,
      identificadorPaciente,
      esNuevoPaciente
    });

    await nuevaCita.save();

    res.status(201).json({
      message: esNuevoPaciente ? "Cita y expediente creados correctamente" : "Cita creada para paciente existente",
      cita: nuevaCita,
      pacienteNuevo: esNuevoPaciente,
      datosIncompletos: !tieneDatosRelevantes
    });
  } catch (error) {
    console.error("Error al crear cita manual completa:", error);
    res.status(500).json({ message: "Error al crear la cita manual", error: error.message });
  }
};