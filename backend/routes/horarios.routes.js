import express from "express";
import { crearOBloquear, obtenerBloqueos } from "../controllers/horarios.controller.js";

const router = express.Router();

router.post("/:area", crearOBloquear);
router.get("/:area", obtenerBloqueos);

export default router;
