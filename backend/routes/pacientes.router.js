import express from 'express';
import { obtenerTodosPacientes, crearPaciente, eliminarPaciente } from '../controllers/pacientes.controller.js';

const router = express.Router();

router.get('/', obtenerTodosPacientes);
router.post('/', crearPaciente);
router.delete('/:id', eliminarPaciente);

export default router;
