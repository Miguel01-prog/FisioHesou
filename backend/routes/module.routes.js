import { Router } from "express";
import { obtenerModulos, crearModulo, actualizarModulo, eliminarModulo } from "../controllers/module.controller.js";
import { verifyToken, checkRole } from "../libs/auth.middleware.js";

const router = Router();

// Ruta para cargar módulos activos (disponible para todos los logueados)
router.get("/", verifyToken, obtenerModulos);

// Rutas exclusivas para el Superadmin
router.post("/", verifyToken, checkRole("superadmin"), crearModulo);
router.put("/:id", verifyToken, checkRole("superadmin"), actualizarModulo);
router.delete("/:id", verifyToken, checkRole("superadmin"), eliminarModulo);

export default router;
