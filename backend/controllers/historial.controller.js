import mongoose from "mongoose";
import Historial from "../models/historial-pacientes.model.js";
import Nota from "../models/notas.model.js";
import Paciente from "../models/pacientes.model.js";
import Cita from "../models/cita.model.js";

const buildPacienteUpdateFields = (sourceData = {}, fallbackBody = {}) => {
  const fields = {};

  const rawNombres = sourceData.nombres ?? fallbackBody.nombres;
  if (typeof rawNombres === "string" && rawNombres.trim() !== "") {
    fields.nombres = rawNombres.trim();
  }

  const rawApellidos = sourceData.apellidos ?? fallbackBody.apellidos;
  const rawPaterno = sourceData.apellidoPaterno ?? fallbackBody.apellidoPaterno;
  const rawMaterno = sourceData.apellidoMaterno ?? fallbackBody.apellidoMaterno;

  if (typeof rawApellidos === "string" && rawApellidos.trim() !== "") {
    const cleanApellidos = rawApellidos.trim().replace(/\s+/g, " ");
    const parts = cleanApellidos.split(" ");
    fields.apellidoPaterno = (rawPaterno && String(rawPaterno).trim()) || parts[0] || "";
    fields.apellidoMaterno =
      rawMaterno !== undefined
        ? String(rawMaterno).trim()
        : parts.slice(1).join(" ") || "";
    fields.apellidos = cleanApellidos;
  } else if (typeof rawPaterno === "string" && rawPaterno.trim() !== "") {
    fields.apellidoPaterno = rawPaterno.trim();
    if (typeof rawMaterno === "string") {
      fields.apellidoMaterno = rawMaterno.trim();
    }
    fields.apellidos = `${fields.apellidoPaterno} ${fields.apellidoMaterno || ""}`.trim();
  }

  const rawEdad = sourceData.edad ?? fallbackBody.edad;
  if (rawEdad !== undefined && rawEdad !== null && String(rawEdad).trim() !== "") {
    const numEdad = Number(rawEdad);
    if (!isNaN(numEdad)) {
      fields.edad = numEdad;
    }
  }

  const rawTelefono = sourceData.telefono ?? fallbackBody.telefono;
  if (typeof rawTelefono === "string" && rawTelefono.trim() !== "") {
    fields.telefono = rawTelefono.trim();
  }

  const rawEmail =
    sourceData.correoElectronico ??
    sourceData.email ??
    fallbackBody.correoElectronico ??
    fallbackBody.email;
  if (typeof rawEmail === "string" && rawEmail.trim() !== "") {
    fields.email = rawEmail.trim().toLowerCase();
  }

  return fields;
};

// Crear historial + nota SOAP y enlazarlos
export const crearHistorialConNotaSOAP = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { historialData, notaData } = req.body;
    const nuevoHistorial = new Historial({
      ...historialData,
      clientId: req.user.clientId
    });
    const historialGuardado = await nuevoHistorial.save({ session });

    // Sincronizar datos del Paciente y sus Citas (nombres, apellidos, edad, teléfono, correo)
    if (historialData.identificadorPaciente) {
      const updateFields = buildPacienteUpdateFields(historialData, req.body);
      if (Object.keys(updateFields).length > 0) {
        const pacFilter =
          req.user.role === "superadmin"
            ? { identificadorPaciente: historialData.identificadorPaciente }
            : { identificadorPaciente: historialData.identificadorPaciente, clientId: req.user.clientId };

        await Paciente.updateOne(pacFilter, { $set: updateFields }, { session });
        await Cita.updateMany(pacFilter, { $set: updateFields }, { session });
      }
    }

    // Crear nota SOAP solo si notaData tiene contenido real
    const tieneContenidoNota = Boolean(
      (notaData?.contenidoNota && notaData.contenidoNota.trim()) ||
        (notaData?.S && notaData.S.trim()) ||
        (notaData?.O && notaData.O.trim()) ||
        (notaData?.A && notaData.A.trim()) ||
        (notaData?.P && notaData.P.trim())
    );

    let notaGuardada = null;
    if (tieneContenidoNota) {
      const nuevaNota = new Nota({
        ...notaData,
        identificadorPaciente: historialData.identificadorPaciente,
        clientId: req.user.clientId
      });
      notaGuardada = await nuevaNota.save({ session });

      historialGuardado.soapFK = notaGuardada._id;
      await historialGuardado.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      ok: true,
      msg: "Historial y Nota SOAP creados correctamente",
      historial: historialGuardado,
      nota: notaGuardada
    });
  } catch (error) {
    console.log("Error: No se pudo crear", error.message);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Obtener historial con nota SOAP por ID
export const obtenerHistorialConNotaSOAP = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const matchConditions = [
      { identificadorPaciente: id },
      ...(isObjectId ? [{ _id: id }] : [])
    ];
    const filter =
      req.user.role === "superadmin"
        ? { $or: matchConditions }
        : { clientId: req.user.clientId, $or: matchConditions };

    const historial = await Historial.findOne(filter).populate("soapFK");
    if (!historial) return res.status(404).json({ ok: false, msg: "Historial no encontrado" });

    res.json({ ok: true, historial });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Obtener historial por identificadorPaciente u ObjectId
export const obtenerHistorialPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(pacienteId);

    const matchConditions = [
      { identificadorPaciente: pacienteId },
      ...(isObjectId ? [{ _id: pacienteId }] : [])
    ];

    const filter =
      req.user.role === "superadmin"
        ? { $or: matchConditions }
        : { clientId: req.user.clientId, $or: matchConditions };

    const historial = await Historial.findOne(filter).populate("soapFK");

    let patientKey = pacienteId;
    if (historial && historial.identificadorPaciente) {
      patientKey = historial.identificadorPaciente;
    }

    const notasFilter =
      req.user.role === "superadmin"
        ? { identificadorPaciente: patientKey }
        : { clientId: req.user.clientId, identificadorPaciente: patientKey };

    const notas = await Nota.find(notasFilter).sort({ createdAt: -1 });

    res.json({
      ok: true,
      historial: historial || null,
      notas: notas || [],
      msg: historial ? "Historial encontrado" : "Sin historial registrado aún"
    });
  } catch (error) {
    console.error("Error en obtenerHistorialPorPaciente:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Actualizar historial clínico (y opcionalmente su nota SOAP) por ID o identificadorPaciente
export const actualizarHistorial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { historialData, notaData } = req.body;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const matchConditions = [
      { identificadorPaciente: id },
      ...(isObjectId ? [{ _id: id }] : [])
    ];
    const filter =
      req.user.role === "superadmin"
        ? { $or: matchConditions }
        : { clientId: req.user.clientId, $or: matchConditions };

    const historialExistente = await Historial.findOne(filter);
    if (!historialExistente) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ ok: false, msg: "Historial no encontrado" });
    }

    // Datos a actualizar
    const dataToUpdate = historialData ? { ...historialData } : { ...req.body };
    delete dataToUpdate._id;
    delete dataToUpdate.clientId;
    if (dataToUpdate.soapFK && typeof dataToUpdate.soapFK === "object") {
      delete dataToUpdate.soapFK;
    }

    Object.assign(historialExistente, dataToUpdate);
    await historialExistente.save({ session });

    // Sincronizar datos del paciente (nombres, apellidos, edad, teléfono, correo) en Paciente y Cita
    const finalPacienteId =
      dataToUpdate.identificadorPaciente || historialExistente.identificadorPaciente;
    if (finalPacienteId) {
      const updateFields = buildPacienteUpdateFields(dataToUpdate, req.body);
      if (Object.keys(updateFields).length > 0) {
        const pacFilter =
          req.user.role === "superadmin"
            ? { identificadorPaciente: finalPacienteId }
            : { identificadorPaciente: finalPacienteId, clientId: req.user.clientId };

        await Paciente.updateOne(pacFilter, { $set: updateFields }, { session });
        await Cita.updateMany(pacFilter, { $set: updateFields }, { session });
      }
    }

    // Actualizar nota SOAP si viene notaData o soapData
    const datosNota = notaData || req.body.soapData || null;
    if (datosNota) {
      if (historialExistente.soapFK) {
        await Nota.findByIdAndUpdate(
          historialExistente.soapFK,
          {
            ...datosNota,
            clientId: req.user.clientId
          },
          { session }
        );
      } else {
        const tieneContenidoNota = Boolean(
          (datosNota.contenidoNota && datosNota.contenidoNota.trim()) ||
            (datosNota.S && datosNota.S.trim()) ||
            (datosNota.O && datosNota.O.trim()) ||
            (datosNota.A && datosNota.A.trim()) ||
            (datosNota.P && datosNota.P.trim())
        );
        if (tieneContenidoNota) {
          const nuevaNota = new Nota({
            ...datosNota,
            identificadorPaciente: finalPacienteId,
            clientId: req.user.clientId
          });
          const notaGuardada = await nuevaNota.save({ session });
          historialExistente.soapFK = notaGuardada._id;
          await historialExistente.save({ session });
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    const historialActualizado = await Historial.findById(historialExistente._id).populate(
      "soapFK"
    );

    res.json({
      ok: true,
      msg: "Historial actualizado correctamente",
      historial: historialActualizado
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error al actualizar historial:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
