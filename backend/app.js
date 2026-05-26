import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import citasRoutes from "./routes/citas.routes.js";
import horariosRoutes from "./routes/horarios.routes.js";
import pacientesRoutes from "./routes/pacientes.router.js";
import notasRoutes from "./routes/notas.route.js";
import historialNotasRoutes from "./routes/historial-notas.route.js";
import configuracionRoutes from "./routes/configuracion.routes.js";
import ejerciciosRoutes from "./routes/ejercicios.routes.js";
import planesRoutes from "./routes/planes.routes.js";
import path from "path";

const app = express();

import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

app.use(helmet());
app.use(mongoSanitize());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 solicitudes por `window` (aquí, por 15 minutos)
  message: "Demasiadas solicitudes desde esta IP, por favor intente de nuevo después de 15 minutos"
});
app.use(limiter);
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Servir archivos estáticos para las imágenes
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/horarios", horariosRoutes);
app.use("/api/pacientes", pacientesRoutes);
app.use("/api/notas", notasRoutes);
app.use("/api/historial-notas", historialNotasRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/ejercicios", ejerciciosRoutes);
app.use("/api/planes", planesRoutes);


export default app;
