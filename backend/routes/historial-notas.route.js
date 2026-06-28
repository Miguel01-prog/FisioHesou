import { Router } from "express";
import { 
  crearHistorialConNotaSOAP, 
  obtenerHistorialConNotaSOAP,
  obtenerHistorialPorPaciente
} from "../controllers/historial.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = Router();

router.use(verifyToken);

// Crear historial + nota SOAP
router.post("/", crearHistorialConNotaSOAP);

// Obtener historial por identificadorPaciente
router.get("/paciente/:pacienteId", obtenerHistorialPorPaciente);

// Obtener historial + nota SOAP por ID
router.get("/:id", obtenerHistorialConNotaSOAP);

export default router;
