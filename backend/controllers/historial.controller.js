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

      // Crear nota SOAP y asociarla al historial
      const nuevaNota = new Nota({
        ...notaData,
        identificadorPaciente: historialData.identificadorPaciente,
        clientId: req.user.clientId
      });
      const notaGuardada = await nuevaNota.save({ session });

      historialGuardado.soapFK = notaGuardada._id;
      await historialGuardado.save({ session });

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

// Obtener historial con nota SOAP
export const obtenerHistorialConNotaSOAP = async (req, res) => {
  try {
    const historial = await Historial.findOne({ _id: req.params.id, clientId: req.user.clientId }).populate("soapFK");
    if (!historial) return res.status(404).json({ ok: false, msg: "Historial no encontrado" });

    res.json({ ok: true, historial });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Obtener historial por identificadorPaciente
export const obtenerHistorialPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const historial = await Historial.findOne({ identificadorPaciente: pacienteId, clientId: req.user.clientId }).populate("soapFK");
    if (!historial) {
      return res.status(404).json({ ok: false, msg: "No se encontró historial para este paciente" });
    }
    res.json({ ok: true, historial });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
