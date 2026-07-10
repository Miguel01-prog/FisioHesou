import express from "express";
import { crearOBloquear, obtenerBloqueos } from "../controllers/horarios.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = express.Router();

router.post("/:area", verifyToken, crearOBloquear);
router.get("/:area", obtenerBloqueos);

export default router;
