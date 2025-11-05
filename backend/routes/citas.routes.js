import express from "express";
import {crearCita, obtenerCitas, obtenerCitaPorId, eliminarCita} from "../controllers/citas.controller.js";

const router = express.Router();


router.post("/", crearCita);
router.get("/", obtenerCitas);

// Obtener cita por ID
router.get("/:id", obtenerCitaPorId);

// Eliminar cita por ID
router.delete("/:id", eliminarCita);

export default router;
