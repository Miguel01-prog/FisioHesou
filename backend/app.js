import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";

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
import rateLimit from "express-rate-limit";

if (process.env.NODE_ENV === "production") {
  app.use(helmet());
} else {
  // Relaxed development security to allow cross-origin assets and images
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 20000, // Safe high limit in development to avoid blockages
  message: "Demasiadas solicitudes desde esta IP, por favor intente de nuevo después de 15 minutos"
});
app.use(limiter);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por la política de CORS de la aplicación"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});
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
