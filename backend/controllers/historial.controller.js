import mongoose from "mongoose";
import Historial from "../models/historial-pacientes.model.js";
import Nota from "../models/notas.model.js";
import Paciente from "../models/pacientes.model.js";

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

      // Si se proporciona la edad en historialData, actualizar el Paciente
      if (historialData.identificadorPaciente && (historialData.edad || req.body.edad)) {
        const edadActualizada = Number(historialData.edad || req.body.edad);
        await Paciente.updateOne(
          { identificadorPaciente: historialData.identificadorPaciente, clientId: req.user.clientId },
          { $set: { edad: edadActualizada } },
          { session }
        );
        console.log(`crearHistorialConNotaSOAP: Edad del paciente ${historialData.identificadorPaciente} actualizada a ${edadActualizada}`);
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
      if(res.status(201)){
        console.log("Success: Se creo correctamente nota e historial")
      }


    } catch (error) {
      console.log("Error: No se pudo crear", error.message)
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
    const filter = req.user.role === 'superadmin' ? { $or: matchConditions } : { clientId: req.user.clientId, $or: matchConditions };

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

    const filter = req.user.role === 'superadmin' 
      ? { $or: matchConditions } 
      : { clientId: req.user.clientId, $or: matchConditions };

    const historial = await Historial.findOne(filter).populate("soapFK");

    let patientKey = pacienteId;
    if (historial && historial.identificadorPaciente) {
      patientKey = historial.identificadorPaciente;
    }

    const notasFilter = req.user.role === 'superadmin'
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
