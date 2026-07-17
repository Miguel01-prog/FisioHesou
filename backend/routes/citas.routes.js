import express from "express";
import { crearCita, crearCitaManual, crearCitaManualCompleta, obtenerCitas, obtenerCitaPorId, eliminarCita, obtenerCitasPorRol,
         validarPacientesNoRegistrados, ObtenerDetallesPaciente, actualizarEstadoCita, actualizarCita} from "../controllers/citas.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = express.Router();

// Public route for patients booking from the public landing page
router.post("/", crearCita);

// Protected clinic management routes
router.get("/validar-pacientes", verifyToken, validarPacientesNoRegistrados);
router.post("/manual", verifyToken, crearCitaManual);
router.post("/manual-completa", verifyToken, crearCitaManualCompleta);
router.get("/", verifyToken, obtenerCitas);
router.get("/rol/:rol", verifyToken, obtenerCitasPorRol);
router.get("/detalles-paciente/:id", verifyToken, ObtenerDetallesPaciente);
router.get("/:id", verifyToken, obtenerCitaPorId);
router.put("/:id/estado", verifyToken, actualizarEstadoCita);
router.put("/:id", verifyToken, actualizarCita);
router.delete("/:id", verifyToken, eliminarCita);

export default router;
