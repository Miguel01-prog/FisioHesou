import express from "express";
import { crearCita, obtenerCitas, obtenerCitaPorId, eliminarCita, obtenerCitasPorRol,
         validarPacientesNoRegistrados, ObtenerDetallesPaciente} from "../controllers/citas.controller.js";

const router = express.Router();

router.get("/validar-pacientes", validarPacientesNoRegistrados);

router.post("/", crearCita);
router.get("/", obtenerCitas);
router.get("/:id", obtenerCitaPorId);
router.delete("/:id", eliminarCita);
router.get("/rol/:rol", obtenerCitasPorRol);
router.get("/detalles-paciente/:id", ObtenerDetallesPaciente);

export default router;
