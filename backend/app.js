import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';


import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import solCitaRoutes from './routes/solicitarCita.routes.js';
import citasRoutes from './routes/citas.routes.js';


//servidor
const app = express();
//iniciando servidor
app.use(cors({
    origin: 'http://localhost:5173',}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use("/api",authRoutes);
app.use("/api",taskRoutes);
app.use("/api",solCitaRoutes)

app.use("/api", citasRoutes)
export default app;
