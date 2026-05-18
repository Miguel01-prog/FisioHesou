import express from "express";
import { crearPlan, obtenerPlanesPorPaciente, obtenerPlanPorId, actualizarPlan } from "../controllers/plan-tratamiento.controller.js";

const router = express.Router();

router.post("/", crearPlan);
router.get("/paciente/:idPaciente", obtenerPlanesPorPaciente);
router.get("/:id", obtenerPlanPorId);
router.put("/:id", actualizarPlan);

export default router;
