import ExpedienteArchivo from "../models/expediente-archivo.model.js";
import Historial from "../models/historial-pacientes.model.js";
import fs from "fs";
import path from "path";

// Subir una o múltiples fotos/documentos al expediente
export const subirArchivosExpediente = async (req, res) => {
  try {
    const { identificadorPaciente, categoria, descripcion } = req.body;

    if (!identificadorPaciente) {
      return res.status(400).json({ ok: false, error: "El identificador del paciente es obligatorio" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ ok: false, error: "No se enviaron archivos para guardar" });
    }

    const archivosGuardados = [];
    const subidoPor = req.user?.name || req.user?.username || "Especialista";

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const url = `/uploads/expedientes/${file.filename}`;

      // Si categoria o descripcion fueron enviadas como arreglos por archivo o individual
      let cat = categoria;
      if (Array.isArray(categoria)) {
        cat = categoria[i] || categoria[0] || "Radiografía";
      } else if (!cat) {
        cat = "Radiografía";
      }

      let desc = descripcion;
      if (Array.isArray(descripcion)) {
        desc = descripcion[i] || "";
      } else if (!desc) {
        desc = "";
      }

      const nuevoArchivo = new ExpedienteArchivo({
        identificadorPaciente: identificadorPaciente.trim(),
        url,
        nombreOriginal: file.originalname,
        mimetype: file.mimetype,
        tamano: file.size,
        categoria: cat,
        descripcion: desc.trim(),
        subidoPor,
        activo: true,
        clientId: req.user.clientId
      });

      const guardado = await nuevoArchivo.save();
      archivosGuardados.push(guardado);
    }

    // Opcional: Si el historial existe, sincronizar referencia
    try {
      const historial = await Historial.findOne({
        identificadorPaciente: identificadorPaciente.trim(),
        clientId: req.user.clientId
      });
      if (historial) {
        if (!Array.isArray(historial.adjuntos)) {
          historial.adjuntos = [];
        }
        archivosGuardados.forEach(a => {
          historial.adjuntos.push({
            archivoId: a._id,
            url: a.url,
            categoria: a.categoria,
            descripcion: a.descripcion,
            nombreOriginal: a.nombreOriginal
          });
        });
        await historial.save();
      }
    } catch (syncErr) {
      console.warn("Advertencia al sincronizar adjuntos con Historial:", syncErr.message);
    }

    res.status(201).json({
      ok: true,
      msg: `${archivosGuardados.length} archivo(s) guardado(s) exitosamente en el expediente`,
      archivos: archivosGuardados
    });
  } catch (error) {
    console.error("Error al subir archivos al expediente:", error);
    res.status(500).json({ ok: false, error: error.message || "Error al subir archivos" });
  }
};

// Obtener todos los archivos del expediente de un paciente
export const obtenerArchivosPorPaciente = async (req, res) => {
  try {
    const { identificadorPaciente } = req.params;

    const filter = {
      identificadorPaciente: identificadorPaciente.trim(),
      activo: true
    };

    if (req.user.role !== "superadmin") {
      filter.clientId = req.user.clientId;
    }

    const archivos = await ExpedienteArchivo.find(filter).sort({ fechaSubida: -1 });

    res.json({
      ok: true,
      archivos
    });
  } catch (error) {
    console.error("Error al obtener archivos del paciente:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Eliminar un archivo del expediente
export const eliminarArchivo = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = { _id: id };
    if (req.user.role !== "superadmin") {
      filter.clientId = req.user.clientId;
    }

    const archivo = await ExpedienteArchivo.findOne(filter);
    if (!archivo) {
      return res.status(404).json({ ok: false, error: "Archivo no encontrado o sin permisos" });
    }

    // Soft delete
    archivo.activo = false;
    await archivo.save();

    // Intentar borrar de disco si existe
    try {
      if (archivo.url && archivo.url.startsWith("/uploads/expedientes/")) {
        const filePath = path.join(process.cwd(), archivo.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (diskErr) {
      console.warn("No se pudo borrar archivo físico del disco:", diskErr.message);
    }

    // Desvincular de Historial si está presente
    try {
      await Historial.updateOne(
        { identificadorPaciente: archivo.identificadorPaciente, clientId: req.user.clientId },
        { $pull: { adjuntos: { archivoId: archivo._id } } }
      );
    } catch (syncErr) {
      console.warn("Advertencia al desvincular de Historial:", syncErr.message);
    }

    res.json({ ok: true, msg: "Archivo eliminado del expediente correctamente" });
  } catch (error) {
    console.error("Error al eliminar archivo del expediente:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Actualizar categoría o descripción de un archivo
export const actualizarArchivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, descripcion } = req.body;

    const filter = { _id: id, activo: true };
    if (req.user.role !== "superadmin") {
      filter.clientId = req.user.clientId;
    }

    const updates = {};
    if (categoria) updates.categoria = categoria;
    if (descripcion !== undefined) updates.descripcion = descripcion.trim();

    const archivoActualizado = await ExpedienteArchivo.findOneAndUpdate(
      filter,
      { $set: updates },
      { new: true }
    );

    if (!archivoActualizado) {
      return res.status(404).json({ ok: false, error: "Archivo no encontrado o sin permisos" });
    }

    res.json({ ok: true, archivo: archivoActualizado, msg: "Archivo actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar archivo:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
