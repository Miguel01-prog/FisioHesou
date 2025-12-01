import mongoose from "mongoose";
import Historial from "../models/historial-pacientes.model.js";
import Nota from "../models/notas.model.js";

// Crear historial + nota SOAP y enlazarlos
export const crearHistorialConNotaSOAP = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { historialData, notaData } = req.body;
      const nuevoHistorial = new Historial(historialData);
      const historialGuardado = await nuevoHistorial.save({ session });

      // Crear nota SOAP y asociarla al historial
      const nuevaNota = new Nota({
        ...notaData,
        identificadorPaciente: historialData.identificadorPaciente,
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
  const historial = await Historial.findById(req.params.id).populate("soapFK");
  if (!historial) return res.status(404).json({ ok: false, msg: "Historial no encontrado" });


  res.json({ ok: true, historial });


  } catch (error) {
  res.status(500).json({ ok: false, error: error.message });
  }
};
