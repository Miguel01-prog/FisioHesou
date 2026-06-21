import express from "express";
import { crearCita, crearCitaManual, obtenerCitas, obtenerCitaPorId, eliminarCita, obtenerCitasPorRol,
         validarPacientesNoRegistrados, ObtenerDetallesPaciente, actualizarEstadoCita, actualizarCita} from "../controllers/citas.controller.js";

const router = express.Router();

router.get("/validar-pacientes", validarPacientesNoRegistrados);

router.post("/", crearCita);
router.post("/manual", crearCitaManual);
router.get("/", obtenerCitas);
router.get("/:id", obtenerCitaPorId);
router.put("/:id", actualizarCita);
router.delete("/:id", eliminarCita);
router.put("/:id/estado", actualizarEstadoCita);
router.get("/rol/:rol", obtenerCitasPorRol);
router.get("/detalles-paciente/:id", ObtenerDetallesPaciente);

export default router;
