import express from "express";
import {
    crearNota,
    obtenerNotas,
    obtenerNotaPorId,
    obtenerNotasPorHistorial,
    obtenerNotasPorPaciente,
    actualizarNota,
    eliminarNota, generaridHistoricoFk
} from "../controllers/notas.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/generar-id", generaridHistoricoFk);  
router.post("/", crearNota);                  // Crear
router.get("/", obtenerNotas);                // Obtener todas
router.get("/historial/:idHistorialFK", obtenerNotasPorHistorial);
router.get("/paciente/:pacienteId", obtenerNotasPorPaciente);
router.get("/:id", obtenerNotaPorId);         // Obtener por id nota

router.put("/:id", actualizarNota);           
router.delete("/:id", eliminarNota);  
 

export default router;
