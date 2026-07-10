import express from "express";
import { obtenerConfiguraciones, crearConfiguracion, crearItem, obtenerItemsPorClave, eliminarItem} from "../controllers/configuracion.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/confGen", obtenerConfiguraciones);
router.post("/", crearConfiguracion);
router.post("/item/:configId", crearItem);
router.get("/item/:clave", obtenerItemsPorClave);
router.delete("/item/:itemId", eliminarItem);
export default router;