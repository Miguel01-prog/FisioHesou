import express from "express";
import {
    crearNota,
    obtenerNotas,
    obtenerNotaPorId,
    obtenerNotasPorHistorial,
    obtenerNotasPorPaciente,
    actualizarNota,
    eliminarNota
} from "../controllers/notas.controller.js";

const router = express.Router();

router.post("/", crearNota);                  // Crear
router.get("/", obtenerNotas);                // Obtener todas
router.get("/:id", obtenerNotaPorId);         // Obtener por id nota
router.get("/historial/:idHistorialFK", obtenerNotasPorHistorial);
router.get("/paciente/:pacienteId", obtenerNotasPorPaciente);

router.put("/:id", actualizarNota);           // Actualizar
router.delete("/:id", eliminarNota);          // Eliminar

export default router;
