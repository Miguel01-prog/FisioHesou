import express from "express";
import { obtenerNotificaciones, eliminarNotificacion } from "../controllers/notification.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/:area", obtenerNotificaciones);
router.delete("/:id", eliminarNotificacion);

export default router;
