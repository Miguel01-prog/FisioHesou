import Nota from "../models/notas.model.js";
import Cita from "../models/cita.model.js";

// Crear nota
export const crearNota = async (req, res) => {
    try {
        const nuevaNota = new Nota(req.body);
        await nuevaNota.save();

        // Automatización: Cambiar estado de la cita más cercana a "Asistió"
        if (nuevaNota.identificadorPaciente) {
            const ahora = new Date();
            const citasProgramadas = await Cita.find({
                identificadorPaciente: nuevaNota.identificadorPaciente,
                estado: "Programado"
            });

            if (citasProgramadas.length > 0) {
                // Encontrar la cita más cercana a "ahora"
                let citaMasCercana = citasProgramadas[0];
                let diferenciaMinima = Math.abs(ahora - new Date(citaMasCercana.fechaCita));

                for (let i = 1; i < citasProgramadas.length; i++) {
                    const diff = Math.abs(ahora - new Date(citasProgramadas[i].fechaCita));
                    if (diff < diferenciaMinima) {
                        diferenciaMinima = diff;
                        citaMasCercana = citasProgramadas[i];
                    }
                }

                // Actualizar estado de la cita más cercana a "Asistió"
                citaMasCercana.estado = "Asistió";
                await citaMasCercana.save();
                console.log(`Cita automática: Se marcó la cita del ${citaMasCercana.fechaCitaStr} a las ${citaMasCercana.horaCita} como "Asistió".`);
            }
        }

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



export const generaridHistoricoFk = async (req, res) => {
    console.log("Creando Id nota...")
    try {
        const { nombrePaciente, apellidoPaciente, identificadorPaciente } = req.body;

        if (!nombrePaciente || !apellidoPaciente || !identificadorPaciente) {
            return res.status(400).json({
                message: "Faltan datos: nombrePaciente, apellidoPaciente, identificadorPaciente"
            });
        }

        // Fecha actual en formato MM-YYYY
        const fecha = new Date();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // 01-12
        const año = fecha.getFullYear();
        const mesAñoNota = `${mes}-${año}`;

        // Contar cuántas notas tiene este paciente en el mes
        const cantidadNotas = await Nota.countDocuments({
            identificadorPaciente
        });

        // Generar ID: iniciales + fecha + conteo + random
        const parts = apellidoPaciente.trim().split(/\s+/).filter(Boolean);
        let apellidoIniciales = "";
        parts.forEach(part => {
            if (part && part[0]) {
                apellidoIniciales += part[0];
            }
        });
        const iniciales = `${nombrePaciente[0]}${apellidoIniciales}`.toUpperCase();
        const idHistoricoFk = `${iniciales}-${mesAñoNota}-${cantidadNotas + 1}`;

        res.json({ idHistoricoFk, mesAñoNota });
    } catch (err) {
        res.status(500).json({ message: "Error al generar ID", error: err.message });
    }
};



