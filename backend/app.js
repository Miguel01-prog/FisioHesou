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

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/horarios", horariosRoutes);
app.use("/api/pacientes", pacientesRoutes);
app.use("/api/notas", notasRoutes);
app.use("/api/historial-notas", historialNotasRoutes);
app.use("/api/configuracion", configuracionRoutes);


export default app;
