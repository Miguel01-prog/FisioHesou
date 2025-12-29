import express from "express";
import { obtenerConfiguraciones, crearConfiguracion, crearItem } from "../controllers/configuracion.controller.js";
const router = express.Router();

router.get("/confGen", obtenerConfiguraciones);
router.post("/", crearConfiguracion);
router.post("/item/:configId", crearItem);
export default router;