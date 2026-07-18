import express from "express";
import { crearCliente, obtenerClientes, obtenerClientePorSubdomain, actualizarCliente, obtenerStatsSuperadmin } from "../controllers/client.controller.js";
import { verifyToken, checkRole } from "../libs/auth.middleware.js";

const router = express.Router();

// Ruta pública para cargar datos de la clínica antes de agendar
router.get("/subdomain/:subdomain", obtenerClientePorSubdomain);

// Rutas protegidas solo para superadmin global
router.get("/stats", verifyToken, checkRole("superadmin"), obtenerStatsSuperadmin);
router.get("/", verifyToken, checkRole("superadmin"), obtenerClientes);
router.post("/", verifyToken, checkRole("superadmin"), crearCliente);
router.put("/:id", verifyToken, checkRole("superadmin"), actualizarCliente);

export default router;
