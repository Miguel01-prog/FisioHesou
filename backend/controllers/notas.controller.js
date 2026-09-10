import Nota from "../models/notas.model.js";
import Cita from "../models/cita.model.js";
import Historial from "../models/historial-pacientes.model.js";

// Crear nota
export const crearNota = async (req, res) => {
    try {
        const { contenidoNota, S, O, A, P } = req.body;
        const contenidoFinal = (contenidoNota && contenidoNota.trim()) 
            ? contenidoNota.trim() 
            : "Nota de evolución y seguimiento clínico";

        const nuevaNota = new Nota({
            ...req.body,
            contenidoNota: contenidoFinal,
            S: S || "",
            O: O || "",
            A: A || "",
            P: P || "",
            clientId: req.user.clientId
        });
        await nuevaNota.save();

        if (nuevaNota.identificadorPaciente) {
            // Vincular al historial clínico si este aún no tiene soapFK asignada
            try {
                const historial = await Historial.findOne({
                    identificadorPaciente: nuevaNota.identificadorPaciente,
                    clientId: req.user.clientId
                });
                if (historial && !historial.soapFK) {
                    historial.soapFK = nuevaNota._id;
                    await historial.save();
                }
            } catch (histErr) {
                console.error("Error al vincular nota al historial:", histErr);
            }

            // Automatización: Cambiar estado de citas activas del paciente a "Asistió"
            const resultCitas = await Cita.updateMany(
                {
                    identificadorPaciente: nuevaNota.identificadorPaciente,
                    estado: { $nin: ["Cancelado", "Asistió"] },
                    clientId: req.user.clientId
                },
                { $set: { estado: "Asistió" } }
            );
            console.log(`Cita automática: Se actualizaron ${resultCitas.modifiedCount} citas del paciente a "Asistió".`);

            // Limpiar notificación de "Nota SOAP Pendiente" si existía
            try {
                const Notification = (await import("../models/notification.model.js")).default;
                await Notification.deleteMany({
                    identificadorPaciente: nuevaNota.identificadorPaciente,
                    type: "pending_soap",
                    clientId: req.user.clientId
                });
            } catch (e) {
                console.error("Error al limpiar notificación pending_soap:", e);
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
        const notas = await Nota.find({ clientId: req.user.clientId });
        res.json(notas);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener notas", error: err.message });
    }
};

// Obtener nota por ID
export const obtenerNotaPorId = async (req, res) => {
    try {
        const nota = await Nota.findOne({ _id: req.params.id, clientId: req.user.clientId });
        if (!nota) return res.status(404).json({ message: "Nota no encontrada" });

        res.json(nota);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener la nota", error: err.message });
    }
};

// Obtener notas por historial
export const obtenerNotasPorHistorial = async (req, res) => {
    try {
        const notas = await Nota.find({ idHistorialFK: req.params.idHistorialFK, clientId: req.user.clientId });
        res.json(notas);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener notas", error: err.message });
    }
};

// Obtener notas por paciente
export const obtenerNotasPorPaciente = async (req, res) => {
    try {
        const notas = await Nota.find({ identificadorPaciente: req.params.pacienteId, clientId: req.user.clientId });
        res.json(notas);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener notas", error: err.message });
    }
};

// Actualizar nota
export const actualizarNota = async (req, res) => {
    try {
        const notaActualizada = await Nota.findOneAndUpdate(
            { _id: req.params.id, clientId: req.user.clientId },
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
        const notaEliminada = await Nota.findOneAndDelete({ _id: req.params.id, clientId: req.user.clientId });

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

        // Obtener todas las notas registradas para este paciente
        const notasExistentes = await Nota.find({
            identificadorPaciente,
            clientId: req.user.clientId
        });

        // Filtrar solo las notas con contenido real
        const notasValidas = notasExistentes.filter(n => {
            const hasContenido = Boolean(
                n.contenidoNota && 
                n.contenidoNota.trim() !== "" && 
                n.contenidoNota !== "Nota de evolución y seguimiento clínico" &&
                n.contenidoNota !== "Nota de seguimiento clínico sin observaciones"
            );
            const hasSOAP = Boolean(
                (n.S && n.S.trim() !== "") ||
                (n.O && n.O.trim() !== "") ||
                (n.A && n.A.trim() !== "") ||
                (n.P && n.P.trim() !== "")
            );
            return hasContenido || hasSOAP;
        });

        // La siguiente nota será el número de notas válidas + 1 (1 si no tiene ninguna)
        const numeroNota = notasValidas.length + 1;

        // Generar ID: iniciales + fecha + numeroNota
        const parts = apellidoPaciente.trim().split(/\s+/).filter(Boolean);
        let apellidoIniciales = "";
        parts.forEach(part => {
            if (part && part[0]) {
                apellidoIniciales += part[0];
            }
        });
        const iniciales = `${nombrePaciente[0]}${apellidoIniciales}`.toUpperCase();
        const idHistoricoFk = `${iniciales}-${mesAñoNota}-${numeroNota}`;

        res.json({ idHistoricoFk, mesAñoNota, numeroNota });
    } catch (err) {
        res.status(500).json({ message: "Error al generar ID", error: err.message });
    }
};



