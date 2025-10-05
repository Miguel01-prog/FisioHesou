import { Router } from 'express';
import { verifyToken, checkRole } from '../libs/auth.middleware.js';

const router = Router();

// Solo fisioterapeuta y superadmin pueden ver estas rutas
router.get('/fisioterapeuta', verifyToken, checkRole('fisioterapeuta', 'superadmin'), (req, res) => {
  res.json({ message: 'Contenido para fisioterapeuta' });
});

// Solo nutrióloga y superadmin
router.get('/nutriologa', verifyToken, checkRole('nutriologa', 'superadmin'), (req, res) => {
  res.json({ message: 'Contenido para nutrióloga' });
});

// Solo superadmin
router.get('/admin', verifyToken, checkRole('superadmin'), (req, res) => {
  res.json({ message: 'Contenido para superadmin' });
});

export default router;
