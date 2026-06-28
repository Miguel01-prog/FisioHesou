import express from "express";
import { crearPlan, obtenerPlanesPorPaciente, obtenerPlanPorId, actualizarPlan } from "../controllers/plan-tratamiento.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", crearPlan);
router.get("/paciente/:idPaciente", obtenerPlanesPorPaciente);
router.get("/:id", obtenerPlanPorId);
router.put("/:id", actualizarPlan);

export default router;
