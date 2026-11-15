import express from "express";
import {
  obtenerPlanesCostos,
  obtenerPlanCostoPorId,
  crearPlanCosto,
  actualizarPlanCosto,
  toggleEstadoPlanCosto,
  eliminarPlanCosto
} from "../controllers/costos-planes.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", obtenerPlanesCostos);
router.get("/:id", obtenerPlanCostoPorId);
router.post("/", crearPlanCosto);
router.put("/:id", actualizarPlanCosto);
router.patch("/:id/estado", toggleEstadoPlanCosto);
router.delete("/:id", eliminarPlanCosto);

export default router;
