import express from "express";
import {
  crearCita,
  obtenerCitas,
  obtenerCitaPorId,
  eliminarCita,
  obtenerCitasPorRol
} from "../controllers/citas.controller.js";

const router = express.Router();

router.post("/", crearCita);
router.get("/", obtenerCitas);
router.get("/:id", obtenerCitaPorId);
router.delete("/:id", eliminarCita);

// Nueva ruta
router.get("/rol/:rol", obtenerCitasPorRol);

export default router;
