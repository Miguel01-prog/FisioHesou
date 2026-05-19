import express from "express";
import { obtenerConfiguraciones, crearConfiguracion, crearItem, obtenerItemsPorClave} from "../controllers/configuracion.controller.js";
const router = express.Router();

router.get("/confGen", obtenerConfiguraciones);
router.post("/", crearConfiguracion);
router.post("/item/:configId", crearItem);
router.get("/item/:clave", obtenerItemsPorClave);
export default router;