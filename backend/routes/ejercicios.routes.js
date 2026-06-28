import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { crearEjercicio, obtenerEjercicios, eliminarEjercicio } from "../controllers/ejercicio.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// Configurar multer para guardar imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), "uploads", "ejercicios");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.post("/", upload.single("imagen"), crearEjercicio);
router.get("/", obtenerEjercicios);
router.delete("/:id", eliminarEjercicio);

export default router;
