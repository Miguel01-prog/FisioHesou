import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  subirArchivosExpediente, 
  obtenerArchivosPorPaciente, 
  eliminarArchivo,
  actualizarArchivo 
} from "../controllers/expediente-archivo.controller.js";
import { verifyToken } from "../libs/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// Configuración de multer para guardar fotos de radiografías, recetas y expedientes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "expedientes");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Sanitizar nombre de archivo y evitar colisiones
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}-${sanitizedName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // Límite de 25MB por archivo
});

// Rutas
router.post("/subir", upload.array("archivos", 10), subirArchivosExpediente);
router.get("/paciente/:identificadorPaciente", obtenerArchivosPorPaciente);
router.delete("/:id", eliminarArchivo);
router.put("/:id", actualizarArchivo);

export default router;
