import Nota from "../models/notas.model.js";

// Crear nota
export const crearNota = async (req, res) => {
    try {
        const nuevaNota = new Nota(req.body);
        await nuevaNota.save();

        res.status(201).json({ message: "Nota creada correctamente", nota: nuevaNota });
    } catch (err) {
        res.status(500).json({ message: "Error al crear nota", error: err.message });
    }
};


// Obtener todas las notas
export const obtenerNotas = async (req, res) => {
    try {
        const notas = await Nota.find();
        res.json(notas);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener notas", error: err.message });
    }
};

// Obtener nota por ID
export const obtenerNotaPorId = async (req, res) => {
    try {
        const nota = await Nota.findById(req.params.id);
        if (!nota) return res.status(404).json({ message: "Nota no encontrada" });

        res.json(nota);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener la nota", error: err.message });
    }
};

// Obtener notas por historial
export const obtenerNotasPorHistorial = async (req, res) => {
    try {
        const notas = await Nota.find({ idHistorialFK: req.params.idHistorialFK });
        res.json(notas);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener notas", error: err.message });
    }
};

// Obtener notas por paciente
export const obtenerNotasPorPaciente = async (req, res) => {
    try {
        const notas = await Nota.find({ identificadorPaciente: req.params.pacienteId });
        res.json(notas);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener notas", error: err.message });
    }
};

// Actualizar nota
export const actualizarNota = async (req, res) => {
    try {
        const notaActualizada = await Nota.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!notaActualizada)
            return res.status(404).json({ message: "Nota no encontrada" });

        res.json({ message: "Nota actualizada", nota: notaActualizada });
    } catch (err) {
        res.status(500).json({ message: "Error al actualizar nota", error: err.message });
    }
};

// Eliminar nota
export const eliminarNota = async (req, res) => {
    try {
        const notaEliminada = await Nota.findByIdAndDelete(req.params.id);

        if (!notaEliminada)
            return res.status(404).json({ message: "Nota no encontrada" });

        res.json({ message: "Nota eliminada correctamente" });
    } catch (err) {
        res.status(500).json({ message: "Error al eliminar nota", error: err.message });
    }
};
