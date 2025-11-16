import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import citasRoutes from './routes/citas.routes.js';
import horariosRoutes from './routes/horarios.routes.js';
import pacientesRoutes from './routes/pacientes.router.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
//app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Montar rutas con prefijo propio
app.use('/api/auth', authRoutes);        // login, register
app.use('/api/citas', citasRoutes);      // rutas de citas
app.use('/api/horarios', horariosRoutes);// rutas de horarios
app.use('/api/pacientes', pacientesRoutes);      // rutas de pacientes
// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

export default app;
