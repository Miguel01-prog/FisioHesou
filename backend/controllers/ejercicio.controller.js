import Ejercicio from "../models/ejercicio.model.js";
import fs from "fs";

const fileToDataUri = (file) => {
    try {
        if (!file || !file.path || !fs.existsSync(file.path)) return "";
        const buffer = fs.readFileSync(file.path);
        const mime = file.mimetype || "image/jpeg";
        return `data:${mime};base64,${buffer.toString("base64")}`;
    } catch (err) {
        console.warn("No se pudo convertir archivo a Base64:", err.message);
        return file?.filename ? `/uploads/ejercicios/${file.filename}` : "";
    }
};

export const crearEjercicio = async (req, res) => {
    try {
        const { nombre, descripcion, imagenBase64, imagenUrl: bodyImagenUrl } = req.body;
        let imagenUrl = "";

        if (imagenBase64 && String(imagenBase64).startsWith("data:")) {
            imagenUrl = imagenBase64;
        } else if (bodyImagenUrl && String(bodyImagenUrl).startsWith("data:")) {
            imagenUrl = bodyImagenUrl;
        } else if (req.file) {
            imagenUrl = fileToDataUri(req.file);
        }

        const nuevoEjercicio = new Ejercicio({
            nombre,
            descripcion,
            imagenUrl,
            clientId: req.user.clientId
        });

        const ejercicioGuardado = await nuevoEjercicio.save();

        // Sincronizar ejercicios previos con el mismo nombre que hayan perdido su imagen en Render
        if (imagenUrl && nombre) {
            await Ejercicio.updateMany(
                {
                    clientId: req.user.clientId,
                    nombre: { $regex: new RegExp(`^\\s*${nombre.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") },
                    _id: { $ne: ejercicioGuardado._id }
                },
                { $set: { imagenUrl } }
            );
        }

        res.status(201).json({ ok: true, ejercicio: ejercicioGuardado });
    } catch (error) {
        console.error("Error al crear ejercicio:", error);
        res.status(500).json({ ok: false, error: "Error al crear el ejercicio" });
    }
};

export const actualizarEjercicio = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, imagenBase64, imagenUrl: bodyImagenUrl } = req.body;

        const ejercicio = await Ejercicio.findOne({ _id: id });
        if (!ejercicio) {
            return res.status(404).json({ ok: false, msg: "Ejercicio no encontrado" });
        }

        if (nombre !== undefined && nombre.trim()) {
            ejercicio.nombre = nombre.trim();
        }
        if (descripcion !== undefined) {
            ejercicio.descripcion = descripcion;
        }

        let nuevaImagenUrl = "";
        if (imagenBase64 && String(imagenBase64).startsWith("data:")) {
            nuevaImagenUrl = imagenBase64;
        } else if (bodyImagenUrl && String(bodyImagenUrl).startsWith("data:")) {
            nuevaImagenUrl = bodyImagenUrl;
        } else if (req.file) {
            nuevaImagenUrl = fileToDataUri(req.file);
        }

        if (nuevaImagenUrl) {
            ejercicio.imagenUrl = nuevaImagenUrl;
        }

        const ejercicioActualizado = await ejercicio.save();

        // Sincronizar otros registros con el mismo nombre por si un plan apunta a un ID anterior
        if (nuevaImagenUrl && ejercicioActualizado.nombre) {
            await Ejercicio.updateMany(
                {
                    nombre: { $regex: new RegExp(`^\\s*${ejercicioActualizado.nombre.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") }
                },
                { $set: { imagenUrl: nuevaImagenUrl } }
            );
        }

        res.json({ ok: true, ejercicio: ejercicioActualizado });
    } catch (error) {
        console.error("Error al actualizar ejercicio:", error);
        res.status(500).json({ ok: false, error: "Error al actualizar el ejercicio" });
    }
};

export const obtenerEjercicios = async (req, res) => {
    try {
        const ejercicios = await Ejercicio.find({
            activo: true,
            $or: [
                { clientId: req.user.clientId },
                { clientId: null }
            ]
        }).sort({ fechaCreacion: -1 });
        res.json({ ok: true, ejercicios });
    } catch (error) {
        console.error("Error al obtener ejercicios:", error);
        res.status(500).json({ ok: false, error: "Error al obtener ejercicios" });
    }
};

export const eliminarEjercicio = async (req, res) => {
    try {
        const { id } = req.params;
        const ejercicio = await Ejercicio.findOneAndUpdate(
            { _id: id, clientId: req.user.clientId },
            { activo: false },
            { new: true }
        );
        
        if (!ejercicio) {
            return res.status(404).json({ ok: false, msg: "Ejercicio no encontrado o sin permisos" });
        }
        
        res.json({ ok: true, msg: "Ejercicio eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar ejercicio:", error);
        res.status(500).json({ ok: false, error: "Error al eliminar ejercicio" });
    }
};
