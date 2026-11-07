import express from 'express';
import {
  obtenerTodosPacientes,
  obtenerPacientesSinNota,
  crearPaciente,
  eliminarPaciente,
  obtenerPacientePorId,
  actualizarPaciente
} from '../controllers/pacientes.controller.js';
import { verifyToken } from '../libs/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', obtenerTodosPacientes);
router.get('/sin-nota', obtenerPacientesSinNota);
router.get('/:id', obtenerPacientePorId);
router.post('/', crearPaciente);
router.put('/:id', actualizarPaciente);
router.delete('/:id', eliminarPaciente);

export default router;
