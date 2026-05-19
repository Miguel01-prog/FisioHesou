import Ejercicio from "../models/ejercicio.model.js";
import fs from "fs";
import path from "path";

export const crearEjercicio = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        let imagenUrl = "";
        
        if (req.file) {
            imagenUrl = `/uploads/ejercicios/${req.file.filename}`;
        }

        const nuevoEjercicio = new Ejercicio({
            nombre,
            descripcion,
            imagenUrl
        });

        const ejercicioGuardado = await nuevoEjercicio.save();
        res.status(201).json({ ok: true, ejercicio: ejercicioGuardado });
    } catch (error) {
        console.error("Error al crear ejercicio:", error);
        res.status(500).json({ ok: false, error: "Error al crear el ejercicio" });
    }
};

export const obtenerEjercicios = async (req, res) => {
    try {
        const ejercicios = await Ejercicio.find({ activo: true }).sort({ fechaCreacion: -1 });
        res.json({ ok: true, ejercicios });
    } catch (error) {
        console.error("Error al obtener ejercicios:", error);
        res.status(500).json({ ok: false, error: "Error al obtener ejercicios" });
    }
};

export const eliminarEjercicio = async (req, res) => {
    try {
        const { id } = req.params;
        const ejercicio = await Ejercicio.findByIdAndUpdate(id, { activo: false }, { new: true });
        
        if (!ejercicio) {
            return res.status(404).json({ ok: false, msg: "Ejercicio no encontrado" });
        }
        
        res.json({ ok: true, msg: "Ejercicio eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar ejercicio:", error);
        res.status(500).json({ ok: false, error: "Error al eliminar ejercicio" });
    }
};
