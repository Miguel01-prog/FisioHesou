import { Router } from "express";
import { 
  crearHistorialConNotaSOAP, 
  obtenerHistorialConNotaSOAP 
} from "../controllers/historial.controller.js";

const router = Router();

// Crear historial + nota SOAP
router.post("/", crearHistorialConNotaSOAP);

// Obtener historial + nota SOAP por ID
router.get("/:id", obtenerHistorialConNotaSOAP);

export default router;
