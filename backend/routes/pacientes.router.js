import express from 'express';
import { obtenerTodosPacientes, crearPaciente, eliminarPaciente, obtenerPacientePorId } from '../controllers/pacientes.controller.js';
import { verifyToken } from '../libs/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', obtenerTodosPacientes);
router.get('/:id', obtenerPacientePorId);
router.post('/', crearPaciente);
router.delete('/:id', eliminarPaciente);

export default router;
