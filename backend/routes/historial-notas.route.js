import { Router } from "express";
import { 
  crearHistorialConNotaSOAP, 
  obtenerHistorialConNotaSOAP,
  obtenerHistorialPorPaciente
} from "../controllers/historial.controller.js";

const router = Router();

// Crear historial + nota SOAP
router.post("/", crearHistorialConNotaSOAP);

// Obtener historial + nota SOAP por ID
router.get("/:id", obtenerHistorialConNotaSOAP);

// Obtener historial por identificadorPaciente
router.get("/paciente/:pacienteId", obtenerHistorialPorPaciente);

export default router;
