import express from 'express';
import { obtenerTodosPacientes } from '../controllers/pacientes.controller.js';

const router = express.Router();

router.get('/', obtenerTodosPacientes);

export default router;
