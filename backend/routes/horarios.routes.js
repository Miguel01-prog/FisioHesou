import express from 'express';
import {
  obtenerDisponibilidad,
  bloquearHoras,
  bloquearDia,
  eliminarBloque
} from '../controllers/horarios.controller.js';

const router = express.Router();

// identificador puede ser _id o nombre (ej: nutriologa)
router.get('/:identificador/disp', obtenerDisponibilidad);
router.post('/:identificador/bloquear-horas', bloquearHoras);
router.post('/:identificador/bloquear-dia', bloquearDia);
router.post('/:identificador/eliminar-bloque', eliminarBloque);

export default router;
